import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { forkJoin } from 'rxjs';
import { Customer } from '../../../core/models/customer.model';
import { Worker } from '../../../core/models/worker.model';
import { BarberService } from '../../../core/models/service.model';
import { AppointmentService } from '../../../data/repositories/appointment.service';
import { CustomerService } from '../../../data/repositories/customer.service';
import { WorkerService } from '../../../data/repositories/worker.service';
import { ServiceCatalogService } from '../../../data/repositories/service-catalog.service';

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

  customers: Customer[] = [];
  workers: Worker[] = [];
  services: BarberService[] = [];
  selectedServices: BarberService[] = [];

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
      clienteId:  [null],
      barberoId:  [null, Validators.required],
      fecha:      ['', Validators.required],
      hora:       ['', Validators.required],
      notas:      [''],
    });

    this.loading = true;
    forkJoin({
      customers: this.customerService.getAll(),
      workers:   this.workerService.getActive(),
      services:  this.serviceCatalog.getActive(),
    }).subscribe(({ customers, workers, services }) => {
      this.customers = customers;
      this.workers   = workers;
      this.services  = services;
      this.loading   = false;

      if (this.isEdit) {
        this.apptService.getById(+id!).subscribe(appt => {
          this.form.patchValue({
            clienteId: appt.clienteId,
            barberoId: appt.barberoId,
            fecha:     appt.fecha,
            hora:      appt.hora,
            notas:     appt.notas,
          });
          this.selectedServices = services.filter(s =>
            appt.servicios.some(as => as.servicioId === s.id)
          );
        });
      }
    });
  }

  toggleService(service: BarberService): void {
    const idx = this.selectedServices.findIndex(s => s.id === service.id);
    if (idx > -1) this.selectedServices.splice(idx, 1);
    else this.selectedServices.push(service);
  }

  isSelected(service: BarberService): boolean {
    return this.selectedServices.some(s => s.id === service.id);
  }

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
    const customer = this.customers.find(c => c.id === v.clienteId);

    const data = {
      clienteId:    v.clienteId,
      clienteNombre: customer ? `${customer.nombre} ${customer.apellido}` : 'Sin cliente',
      barberoId:    v.barberoId,
      barberoNombre: `${worker.nombre} ${worker.apellido}`,
      servicios:    this.selectedServices.map(s => ({ servicioId: s.id, servicioNombre: s.nombre, precio: s.precio, duracionMinutos: s.duracionMinutos })),
      fecha:        v.fecha instanceof Date ? v.fecha.toISOString().split('T')[0] : v.fecha,
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
