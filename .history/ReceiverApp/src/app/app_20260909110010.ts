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
  ) {}

  ngOnInit(): void {
    this.pubsubReceiverService.start();
  }
}