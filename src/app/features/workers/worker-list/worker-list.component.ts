import { Component, OnInit } from '@angular/core';
import { Worker } from '../../../core/models/worker.model';
import { WorkerService } from '../../../data/repositories/worker.service';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-worker-list',
  standalone: false,
  templateUrl: './worker-list.component.html',
  styleUrls: ['./worker-list.component.scss'],
})
export class WorkerListComponent implements OnInit {
  workers: Worker[] = [];
  filtered: Worker[] = [];
  search = '';
  loading = true;

  constructor(private workerService: WorkerService, private snackBar: MatSnackBar) {}

  ngOnInit(): void {
    this.workerService.getAll().subscribe(w => {
      this.workers = w; this.filtered = w; this.loading = false;
    });
  }

  applyFilter(): void {
    const s = this.search.toLowerCase();
    this.filtered = this.workers.filter(w =>
      `${w.nombre} ${w.apellido}`.toLowerCase().includes(s) || w.especialidad.toLowerCase().includes(s)
    );
  }

  toggleStatus(worker: Worker): void {
    this.workerService.update(worker.id, { estado: !worker.estado }).subscribe(() => {
      worker.estado = !worker.estado;
      this.snackBar.open('Estado actualizado', '', { duration: 2000 });
    });
  }
}
