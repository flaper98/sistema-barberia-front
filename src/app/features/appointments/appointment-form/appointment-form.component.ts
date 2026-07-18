import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { forkJoin, Observable } from 'rxjs';
import { debounceTime, distinctUntilChanged, startWith, switchMap } from 'rxjs/operators';
import { Customer } from '../../../core/models/customer.model';
import { Worker } from '../../../core/models/worker.model';
import { BarberService } from '../../../core/models/service.model';
import { AppointmentService } from '../../../data/repositories/appointment.service';
import { CustomerService } from '../../../data/repositories/customer.service';
import { WorkerService } from '../../../data/repositories/worker.service';
import { ServiceCatalogService } from '../../../data/repositories/service-catalog.service';
import { toLocalDateStr } from '../../../core/utils/date.util';

@Component({
  selector: 'app-appointment-form',
  standalone: false,
  templateUrl: './appointment-form.component.html',
})
export class AppointmentFormComponent implements OnInit {
  form!: FormGroup;
  isEdit = false;
  loading = false;
  saving = false;

  workers: Worker[] = [];
  services: BarberService[] = [];
  selectedServices: BarberService[] = [];

  clienteInputCtrl = new FormControl<string | Customer>('');
  filteredCustomers!: Observable<Customer[]>;

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private apptService: AppointmentService,
    private customerService: CustomerService,
    private workerService: WorkerService,
    private serviceCatalog: ServiceCatalogService,
    private snackBar: MatSnackBar,
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    this.isEdit = !!id;

    this.form = this.fb.group({
      barberoId:  [null, Validators.required],
      fecha:      ['', Validators.required],
      hora:       ['', Validators.required],
      notas:      [''],
    });

    // Se busca en el servidor a medida que se escribe (debounced) -- antes
    // se filtraba sobre un customerService.getAll() que en la practica solo
    // traia los primeros 200 clientes (limite del backend), asi que
    // cualquier cliente con ID mas alto no aparecia nunca en el autocomplete.
    this.filteredCustomers = this.clienteInputCtrl.valueChanges.pipe(
      startWith(''),
      debounceTime(300),
      distinctUntilChanged(),
      switchMap(value => {
        const term = typeof value === 'string' ? value : this.displayCustomer(value);
        return this.customerService.search({ search: term || undefined, size: 20 });
      }),
    );

    this.loading = true;
    forkJoin({
      workers:  this.workerService.getActive(),
      services: this.serviceCatalog.getActive(),
    }).subscribe({
      next: ({ workers, services }) => {
        this.workers   = workers;
        this.services  = services;
        this.loading   = false;

        if (this.isEdit) {
          this.apptService.getById(+id!).subscribe({
            next: appt => {
              this.form.patchValue({
                barberoId: appt.barberoId,
                fecha:     appt.fecha,
                hora:      appt.hora ? appt.hora.substring(0, 5) : '',
                notas:     appt.notas,
              });
              this.selectedServices = services.filter(s =>
                appt.servicios.some(as => as.servicioId === s.id)
              );
              // El cliente de la cita puede no estar entre los primeros 20
              // cargados por defecto -- se busca directo por ID.
              if (appt.clienteId) {
                this.customerService.getById(appt.clienteId).subscribe({
                  next: c => this.clienteInputCtrl.setValue(c),
                  error: () => this.clienteInputCtrl.setValue(appt.clienteNombre),
                });
              } else {
                this.clienteInputCtrl.setValue(appt.clienteNombre);
              }
            },
            error: (err: Error) => {
              this.snackBar.open(err.message, 'Cerrar', { duration: 4000 });
              this.router.navigate(['/appointments']);
            },
          });
        }
      },
      error: (err: Error) => {
        this.loading = false;
        this.snackBar.open(err.message, 'Cerrar', { duration: 4000 });
      },
    });
  }

  get selectedServiceIds(): number[] {
    return this.selectedServices.map(s => s.id);
  }

  onServicesChange(ids: number[]): void {
    this.selectedServices = this.services.filter(s => ids.includes(s.id));
  }

  displayCustomer = (customer: string | Customer | null): string => {
    if (!customer) return '';
    return typeof customer === 'string' ? customer : `${customer.nombre} ${customer.apellido}`;
  };

  get totalEstimado(): number {
    return this.selectedServices.reduce((a, s) => a + s.precio, 0);
  }

  get availableHours(): string[] {
    const hours: string[] = [];
    for (let h = 8; h <= 19; h++) {
      hours.push(`${h.toString().padStart(2,'0')}:00`);
      hours.push(`${h.toString().padStart(2,'0')}:30`);
    }
    return hours;
  }

  onSubmit(): void {
    if (this.form.invalid || !this.selectedServices.length) {
      this.form.markAllAsTouched();
      if (!this.selectedServices.length) {
        this.snackBar.open('Selecciona al menos un servicio', '', { duration: 2000 });
      }
      return;
    }

    this.saving = true;
    const v = this.form.value;
    const worker   = this.workers.find(w => w.id === v.barberoId)!;
    const clienteValue = this.clienteInputCtrl.value;
    const esClienteExistente = clienteValue && typeof clienteValue === 'object';
    const clienteId = esClienteExistente ? (clienteValue as Customer).id : null;
    const clienteNombre = esClienteExistente
      ? this.displayCustomer(clienteValue)
      : ((clienteValue as string) || '').trim() || 'Sin cliente';

    const data = {
      clienteId,
      clienteNombre,
      barberoId:    v.barberoId,
      barberoNombre: `${worker.nombre} ${worker.apellido}`,
      servicios:    this.selectedServices.map(s => ({ servicioId: s.id, servicioNombre: s.nombre, precio: s.precio, duracionMinutos: s.duracionMinutos })),
      fecha:        v.fecha instanceof Date ? toLocalDateStr(v.fecha) : v.fecha,
      hora:         v.hora,
      estado:       'PENDIENTE' as const,
      totalEstimado: this.totalEstimado,
      notas:        v.notas,
    };

    const op$ = this.isEdit
      ? this.apptService.update(+this.route.snapshot.paramMap.get('id')!, data)
      : this.apptService.create(data);

    op$.subscribe({
      next: () => {
        this.snackBar.open(`Cita ${this.isEdit ? 'actualizada' : 'creada'} correctamente`, '', { duration: 2500 });
        this.router.navigate(['/appointments']);
      },
      error: (err: Error) => {
        this.saving = false;
        this.snackBar.open(err.message, 'Cerrar', { duration: 4000 });
      },
    });
  }

  cancel(): void {
    this.router.navigate(['/appointments']);
  }
}
