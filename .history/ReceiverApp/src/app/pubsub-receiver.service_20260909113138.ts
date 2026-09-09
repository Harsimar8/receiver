
import {
    PubSub,
    BaseClient,
    PublishedParam,
    DLOG,
    LogLevel
} from 'pubsub-lib';

@Injectable({
    providedIn: 'root'
})
export class PubsubReceiverService {

    private pubsub!: PubSub;
    private client!: BaseClient;
    public myUID: string = '';
    public receivedMessages: string[] = JSON.parse(
        localStorage.getItem('receivedMessages') || '[]'
    );

    start(): void {

        console.log('===== STARTING PUB/SUB RECEIVER =====');

        const logger = console;

        this.pubsub = new PubSub('sonarWeb', logger);

        // Keep reference to THIS service.
        const that = this;

        const client = this.pubsub.createClient({

            async onConnect(): Promise<void> {

                console.log('===== PUB/SUB CONNECTED =====');

                that.myUID = client.selfUID();

                console.log('=================================');
                console.log('MACHINE 2 PUB/SUB UID:');
                console.log(that.myUID);
                console.log('=================================');

                that.pubsub.connectToWebRTC();
            },
            async onAppPublishedParams(
                publishedParams: PublishedParam[]
            ): Promise<void> {

                DLOG(
                    logger,
                    LogLevel.INFO,
                    'Receiver',
                    `Published Params: ${JSON.stringify(publishedParams)}`
                );

            },

            onAppParamRetract(keys: number[]): void {

                DLOG(
                    logger,
                    LogLevel.INFO,
                    'Receiver',
                    `App Params Retracted: ${JSON.stringify(keys)}`
                );

            },

            async onAppPublishedObjects(
                objectKeys: string[]
            ): Promise<void> {

                DLOG(
                    logger,
                    LogLevel.INFO,
                    'Receiver',
                    `Published Objects: ${JSON.stringify(objectKeys)}`
                );

            },

            onAppObjectDelete(objects: number[]): void {

                DLOG(
                    logger,
                    LogLevel.INFO,
                    'Receiver',
                    `App Objects Deleted: ${JSON.stringify(objects)}`
                );

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

                that.receivedMessages.push(message);

                localStorage.setItem(
                    'receivedMessages',
                    JSON.stringify(that.receivedMessages)
                );
            }

        });

        this.client = client;

        const wsUrl = 'ws://192.168.31.86:9090';

        console.log('Connecting to Pub/Sub:', wsUrl);

        this.pubsub.connectToWSService(wsUrl);
    }
}