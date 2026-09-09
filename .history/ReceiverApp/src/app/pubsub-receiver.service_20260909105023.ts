import { Injectable } from '@angular/core';
import { PubSub, BaseClient } from 'pubsub-lib';

@Injectable({
  providedIn: 'root'
})
export class PubsubReceiverService {

  private pubsub!: PubSub;
  private client!: BaseClient;

  start(): void {

    console.log('===== STARTING PUB/SUB RECEIVER =====');

    const logger = console;

    this.pubsub = new PubSub('sonarWeb', logger);

    const client = this.pubsub.createClient({

      async onConnect(): Promise<void> {

        console.log('===== PUB/SUB CONNECTED =====');

        console.log('=================================');
        console.log('MACHINE 2 PUB/SUB UID:');
        console.log(client.selfUID());
        console.log('=================================');

        // Keep this for now because your existing
        // application uses WebRTC after connection.
        this.pubsub.connectToWebRTC();
      },

      async onAppDataFromRemote(
        fromUID: string,
        data: Uint8Array
      ): Promise<void> {

        console.log('===== DATA RECEIVED =====');

        console.log('FROM MACHINE UID:', fromUID);
        console.log('DATA SIZE:', data.length);

        const decoder = new TextDecoder();
        const message = decoder.decode(data);

        console.log('MESSAGE:', message);
      }

    });

    this.client = client;

    /*
     * IMPORTANT:
     *
     * We need the actual WebSocket address here.
     * Do NOT put a random IP/port.
     *
     * We will fill this after checking your
     * existing Sonar WebSocket configuration.
     */

    const wsUrl = 'PUT_WEBSOCKET_URL_HERE';

    this.pubsub.connectToWSService(wsUrl);
  }
}