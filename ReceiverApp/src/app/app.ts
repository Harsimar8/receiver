import { Component } from '@angular/core';

import { CommonModule } from '@angular/common';

import { PubsubReceiverService } from './pubsub-receiver.service';

@Component({
  selector: 'app-root',
  imports: [CommonModule],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {

  constructor(
    public pubsubReceiverService: PubsubReceiverService
  ) { }

  selectedItem: any = null;
  private lastJsonVersion: number = 0;

  ngOnInit(): void {
    this.pubsubReceiverService.start();
  }
  ngDoCheck(): void {

    if (
      this.pubsubReceiverService.jsonVersion !==
      this.lastJsonVersion
    ) {

      this.lastJsonVersion =
        this.pubsubReceiverService.jsonVersion;

      this.selectedItem = null;

    }

  }

  toggleCategory(category: any): void {
    category.expanded = !category.expanded;
  }

  selectItem(item: any): void {
    this.selectedItem = item;
  }

  isObject(value: any): boolean {
    return value !== null &&
      typeof value === 'object' &&
      !Array.isArray(value);
  }

  isArray(value: any): boolean {
    return Array.isArray(value);
  }

  getObjectName(item: any, index: number): string {
    if (item && item.name) {
      return item.name;
    }

    return 'Item ' + (index + 1);
  }

}