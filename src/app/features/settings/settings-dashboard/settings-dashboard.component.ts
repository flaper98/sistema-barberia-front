import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { LoyaltyService } from '../../../data/repositories/loyalty.service';
import { BusinessConfigService } from '../../../data/repositories/business-config.service';
import { IcloudConfigService } from '../../../data/repositories/icloud-config.service';
import { LoyaltyConfig } from '../../../core/models/loyalty.model';
import { DEFAULT_WHATSAPP_WELCOME_TEMPLATE, DEFAULT_WHATSAPP_REMINDER_TEMPLATE } from '../../../core/models/business-config.model';
import { renderWhatsappTemplate } from '../../../core/utils/whatsapp.util';

@Component({ selector: 'app-settings-dashboard', standalone: false, templateUrl: './settings-dashboard.component.html', styleUrls: ['./settings-dashboard.component.scss'] })
export class SettingsDashboardComponent implements OnInit {
  barberyForm!: FormGroup;
  loyaltyForm!: FormGroup;
  icloudForm!: FormGroup;
  loadingBarbery = true;
  loadingIcloud = true;
  savingIcloud = false;
  icloudPasswordConfigured = false;
  saving = false;

  readonly paymentMethods = ['Efectivo', 'Tarjeta de crédito/débito', 'Yape', 'Plin', 'Transferencia bancaria'];
  readonly roles = [
    { nombre: 'ADMIN', descripcion: 'Acceso total al sistema' },
    { nombre: 'BARBER', descripcion: 'Ventas, citas, clientes' },
    { nombre: 'CASHIER', descripcion: 'Ventas, caja, finanzas' },
    { nombre: 'RECEPTION', descripcion: 'Citas, clientes' },
  ];

  constructor(
    private fb: FormBuilder,
    private loyaltyService: LoyaltyService,
    private businessConfigService: BusinessConfigService,
    private icloudConfigService: IcloudConfigService,
    private snackBar: MatSnackBar,
  ) {}

  ngOnInit(): void {
    this.barberyForm = this.fb.group({
      nombre:    ['', Validators.required],
      direccion: [''],
      telefono:  [''],
      email:     [''],
      ruc:       [''],
      horario:   [''],
      logoUrl:   [''],
      mensajeBienvenidaWhatsapp: [DEFAULT_WHATSAPP_WELCOME_TEMPLATE, Validators.maxLength(500)],
      mensajeRecordatorioWhatsapp: [DEFAULT_WHATSAPP_REMINDER_TEMPLATE, Validators.maxLength(500)],
    });

    this.loadingBarbery = true;
    this.businessConfigService.obtener().subscribe({
      next: cfg => {
        this.barberyForm.patchValue(cfg);
        this.loadingBarbery = false;
      },
      error: (err: Error) => {
        this.loadingBarbery = false;
        this.snackBar.open(err.message, 'Cerrar', { duration: 4000 });
      },
    });

    this.loyaltyForm = this.fb.group({
      sellosNecesarios: [5, [Validators.required, Validators.min(1)]],
      sellosPorGanancia: [1, [Validators.required, Validators.min(1)]],
      descripcionRecompensa: [''],
      activo: [true, Validators.required],
    });

    this.loyaltyService.getConfig().subscribe({
      next: (cfg: LoyaltyConfig) => this.loyaltyForm.patchValue(cfg),
      error: (err: Error) => this.snackBar.open(err.message, 'Cerrar', { duration: 4000 }),
    });

    this.icloudForm = this.fb.group({
      username: [''],
      appPassword: [''],
      enabled: [false],
    });

    this.loadingIcloud = true;
    this.icloudConfigService.obtener().subscribe({
      next: cfg => {
        this.icloudForm.patchValue({ username: cfg.username, enabled: cfg.enabled });
        this.icloudPasswordConfigured = cfg.passwordConfigured;
        this.loadingIcloud = false;
      },
      error: (err: Error) => {
        this.loadingIcloud = false;
        this.snackBar.open(err.message, 'Cerrar', { duration: 4000 });
      },
    });
  }

  get vistaPreviaMensaje(): string {
    const plantilla = this.barberyForm?.get('mensajeBienvenidaWhatsapp')?.value || DEFAULT_WHATSAPP_WELCOME_TEMPLATE;
    const negocio = this.barberyForm?.get('nombre')?.value || 'tu barbería';
    return renderWhatsappTemplate(plantilla, { nombre: 'Juan Pérez' }, negocio);
  }

  get vistaPreviaRecordatorio(): string {
    const plantilla = this.barberyForm?.get('mensajeRecordatorioWhatsapp')?.value || DEFAULT_WHATSAPP_REMINDER_TEMPLATE;
    const negocio = this.barberyForm?.get('nombre')?.value || 'tu barbería';
    return renderWhatsappTemplate(plantilla, { nombre: 'Juan Pérez' }, negocio);
  }

  saveBarbery(): void {
    if (this.barberyForm.invalid) { this.barberyForm.markAllAsTouched(); return; }
    this.saving = true;
    this.businessConfigService.actualizar(this.barberyForm.value).subscribe({
      next: () => {
        this.saving = false;
        this.snackBar.open('Configuración guardada', '', { duration: 2500 });
      },
      error: (err: Error) => {
        this.saving = false;
        this.snackBar.open(err.message, 'Cerrar', { duration: 4000 });
      },
    });
  }

  saveIcloud(): void {
    this.savingIcloud = true;
    this.icloudConfigService.actualizar(this.icloudForm.value).subscribe({
      next: cfg => {
        this.savingIcloud = false;
        this.icloudPasswordConfigured = cfg.passwordConfigured;
        this.icloudForm.patchValue({ appPassword: '' });
        this.snackBar.open('Configuración de iCloud guardada', '', { duration: 2500 });
      },
      error: (err: Error) => {
        this.savingIcloud = false;
        this.snackBar.open(err.message, 'Cerrar', { duration: 5000 });
      },
    });
  }

  saveLoyalty(): void {
    if (this.loyaltyForm.invalid) return;
    this.saving = true;
    this.loyaltyService.updateConfig(this.loyaltyForm.value).subscribe({
      next: () => {
        this.saving = false;
        this.snackBar.open('Configuración de fidelización actualizada', '', { duration: 2500 });
      },
      error: (err: Error) => {
        this.saving = false;
        this.snackBar.open(err.message, 'Cerrar', { duration: 4000 });
      },
    });
  }
}
