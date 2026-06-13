import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { LoyaltyService } from '../../../data/repositories/loyalty.service';
import { LoyaltyConfig } from '../../../core/models/loyalty.model';

@Component({ selector: 'app-settings-dashboard', standalone: false, templateUrl: './settings-dashboard.component.html', styleUrls: ['./settings-dashboard.component.scss'] })
export class SettingsDashboardComponent implements OnInit {
  barberyForm!: FormGroup;
  loyaltyForm!: FormGroup;
  saving = false;

  readonly paymentMethods = ['Efectivo', 'Tarjeta de crédito/débito', 'Yape', 'Plin', 'Transferencia bancaria'];
  readonly roles = [
    { nombre: 'ADMIN', descripcion: 'Acceso total al sistema' },
    { nombre: 'BARBER', descripcion: 'Ventas, citas, clientes' },
    { nombre: 'CASHIER', descripcion: 'Ventas, caja, finanzas' },
    { nombre: 'RECEPTION', descripcion: 'Citas, clientes' },
  ];

  constructor(private fb: FormBuilder, private loyaltyService: LoyaltyService, private snackBar: MatSnackBar) {}

  ngOnInit(): void {
    this.barberyForm = this.fb.group({
      nombre:    ['La Barbería del Rey', Validators.required],
      direccion: ['Av. Principal 123, Lima'],
      telefono:  ['01-234-5678'],
      email:     ['contacto@labarberiadelrey.com'],
      ruc:       ['20123456789'],
      horario:   ['Lun-Sáb 9:00 - 20:00'],
    });

    this.loyaltyService.getConfig().subscribe(cfg => {
      this.loyaltyForm = this.fb.group({
        sellosNecesarios: [cfg.sellosNecesarios, [Validators.required, Validators.min(1)]],
      });
    });
  }

  saveBarbery(): void {
    this.saving = true;
    setTimeout(() => { this.saving = false; this.snackBar.open('Configuración guardada', '', { duration: 2500 }); }, 500);
  }

  saveLoyalty(): void {
    if (this.loyaltyForm.invalid) return;
    this.loyaltyService.updateConfig(this.loyaltyForm.value).subscribe(() => {
      this.snackBar.open('Configuración de fidelización actualizada', '', { duration: 2500 });
    });
  }
}
