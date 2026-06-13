import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'sumByField', standalone: false })
export class SumByFieldPipe implements PipeTransform {
  transform(items: any[], field: string): number {
    return items.reduce((acc, item) => acc + (item[field] ?? 0), 0);
  }
}
