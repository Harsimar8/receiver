import { Component } from '@angular/core';
import { PubsubReceiverService } from './pubsub-receiver.service';

@Component({
  selector: 'app-root',
  imports: [],
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