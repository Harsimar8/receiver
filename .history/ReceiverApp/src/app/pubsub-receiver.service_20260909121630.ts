import { Injectable, NgZone } from '@angular/core';

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

    constructor(private zone: NgZone) {}


    // ==========================================
    // MACHINE 2 UID
    // ==========================================

    public myUID: string = '';


    // ==========================================
    // RECEIVED MESSAGES
    // ==========================================

    public receivedMessages: string[] = JSON.parse(
        localStorage.getItem('receivedMessages') || '[]'
    );


    // ==========================================
    // TXT FILE
    // ==========================================

    private txtFileHandle: any = null;

    private txtFileContent: string = '';

    public txtStatus: string = '';


    // ==========================================
    // START PUB/SUB
    // ==========================================

    start(): void {

        console.log(
            '===== STARTING PUB/SUB RECEIVER ====='
        );

        const logger = console;

        this.pubsub =
            new PubSub(
                'sonarWeb',
                logger
            );

        const that = this;


        const client =
            this.pubsub.createClient({

                // ==================================
                // CONNECTED
                // ==================================

                async onConnect(): Promise<void> {

                    console.log(
                        '===== PUB/SUB CONNECTED ====='
                    );


                    that.zone.run(() => {

                        that.myUID =
                            client.selfUID();


                        console.log(
                            '================================='
                        );

                        console.log(
                            'MACHINE 2 PUB/SUB UID:'
                        );

                        console.log(
                            that.myUID
                        );

                        console.log(
                            '================================='
                        );

                    });


                    // Connect WebRTC

                    that.pubsub.connectToWebRTC();


                    // Restore previously selected TXT file

                    that.restoreTxtFile();

                },


                // ==================================
                // PUBLISHED PARAMS
                // ==================================

                async onAppPublishedParams(
                    publishedParams: PublishedParam[]
                ): Promise<void> {

                    DLOG(
                        logger,
                        LogLevel.INFO,
                        'Receiver',
                        `Published Params: ${JSON.stringify(
                            publishedParams
                        )}`
                    );

                },


                // ==================================
                // PARAM RETRACT
                // ==================================

                onAppParamRetract(
                    keys: number[]
                ): void {

                    DLOG(
                        logger,
                        LogLevel.INFO,
                        'Receiver',
                        `App Params Retracted: ${JSON.stringify(
                            keys
                        )}`
                    );

                },


                // ==================================
                // PUBLISHED OBJECTS
                // ==================================

                async onAppPublishedObjects(
                    objectKeys: string[]
                ): Promise<void> {

                    DLOG(
                        logger,
                        LogLevel.INFO,
                        'Receiver',
                        `Published Objects: ${JSON.stringify(
                            objectKeys
                        )}`
                    );

                },


                // ==================================
                // OBJECT DELETE
                // ==================================

                onAppObjectDelete(
                    objects: number[]
                ): void {

                    DLOG(
                        logger,
                        LogLevel.INFO,
                        'Receiver',
                        `App Objects Deleted: ${JSON.stringify(
                            objects
                        )}`
                    );

                },


                // ==================================
                // DATA RECEIVED
                // ==================================

                async onAppDataFromRemote(
                    fromUID: string,
                    data: Uint8Array
                ): Promise<void> {


                    console.log(
                        '===== DATA RECEIVED ====='
                    );

                    console.log(
                        'FROM MACHINE UID:',
                        fromUID
                    );

                    console.log(
                        'DATA SIZE:',
                        data.length
                    );


                    const decoder =
                        new TextDecoder();


                    const message =
                        decoder.decode(data);


                    console.log(
                        'MESSAGE:',
                        message
                    );


                    // ==================================
                    // UPDATE FRONTEND IMMEDIATELY
                    // ==================================

                    that.zone.run(() => {

                        that.receivedMessages.push(
                            message
                        );


                        // Save frontend messages

                        localStorage.setItem(
                            'receivedMessages',
                            JSON.stringify(
                                that.receivedMessages
                            )
                        );


                        console.log(
                            'FRONTEND MESSAGES:',
                            that.receivedMessages
                        );

                    });


                    // ==================================
                    // SAVE TO MACHINE 2 TXT FILE
                    // ==================================

                    if (
                        message.startsWith('TXT:')
                    ) {

                        const txtValue =
                            message.substring(4);


                        console.log(
                            'TXT VALUE:',
                            txtValue
                        );


                        that.txtFileContent +=
                            txtValue + '\r\n';


                        await that.saveTxtFile();


                        that.zone.run(() => {

                            that.txtStatus =
                                'TXT value received and saved';

                        });

                    }

                }

            });


        this.client =
            client;


        // ==========================================
        // WEBSOCKET CONNECTION
        // ==========================================

        const wsUrl =
            'ws://192.168.31.86:9090';


        console.log(
            'Connecting to Pub/Sub:',
            wsUrl
        );


        this.pubsub.connectToWSService(
            wsUrl
        );

    }


    // ==========================================
    // SELECT MACHINE 2 TXT FILE
    // ==========================================

    async chooseTxtFile(): Promise<void> {

        try {

            const handle =
                await (window as any).showSaveFilePicker({

                    suggestedName:
                        'machine2-received-data.txt',

                    types: [
                        {
                            description:
                                'Text file',

                            accept: {
                                'text/plain':
                                    ['.txt']
                            }
                        }
                    ]

                });


            this.txtFileHandle =
                handle;


            console.log(
                'Machine 2 TXT file selected:',
                handle.name
            );


            // ======================================
            // SAVE FILE HANDLE IN INDEXEDDB
            // ======================================

            const request =
                indexedDB.open(
                    'Machine2TxtDB',
                    1
                );


            request.onupgradeneeded = () => {

                const db =
                    request.result;


                if (
                    !db.objectStoreNames.contains(
                        'files'
                    )
                ) {

                    db.createObjectStore(
                        'files'
                    );

                }

            };


            request.onsuccess = () => {

                const db =
                    request.result;


                const transaction =
                    db.transaction(
                        'files',
                        'readwrite'
                    );


                const store =
                    transaction.objectStore(
                        'files'
                    );


                store.put(
                    handle,
                    'machine2TxtFile'
                );


                console.log(
                    '===== MACHINE 2 FILE HANDLE SAVED ====='
                );

            };


            // ======================================
            // READ EXISTING FILE
            // ======================================

            const file =
                await handle.getFile();


            this.txtFileContent =
                await file.text();


            console.log(
                'Existing Machine 2 TXT content:',
                this.txtFileContent
            );


            this.txtStatus =
                'TXT file selected';

            this.zone.run(() => {});


        } catch (error) {

            console.error(
                'TXT file selection error:',
                error
            );


            this.txtStatus =
                'TXT file selection cancelled or failed';

        }

    }


    // ==========================================
    // RESTORE TXT FILE
    // ==========================================

    private restoreTxtFile(): void {

        try {

            const request =
                indexedDB.open(
                    'Machine2TxtDB',
                    1
                );


            request.onupgradeneeded = () => {

                const db =
                    request.result;


                if (
                    !db.objectStoreNames.contains(
                        'files'
                    )
                ) {

                    db.createObjectStore(
                        'files'
                    );

                }

            };


            request.onsuccess = () => {

                const db =
                    request.result;


                const transaction =
                    db.transaction(
                        'files',
                        'readonly'
                    );


                const store =
                    transaction.objectStore(
                        'files'
                    );


                const getRequest =
                    store.get(
                        'machine2TxtFile'
                    );


                getRequest.onsuccess =
                    async () => {

                        const handle =
                            getRequest.result;


                        if (!handle) {

                            console.log(
                                'No saved Machine 2 TXT file'
                            );

                            return;

                        }


                        this.txtFileHandle =
                            handle;


                        console.log(
                            'Machine 2 TXT file restored:',
                            handle.name
                        );


                        try {

                            const permission =
                                await handle.queryPermission({
                                    mode: 'readwrite'
                                });


                            if (
                                permission === 'granted'
                            ) {

                                const file =
                                    await handle.getFile();


                                this.txtFileContent =
                                    await file.text();


                                console.log(
                                    'Restored TXT content:',
                                    this.txtFileContent
                                );


                                this.zone.run(() => {

                                    this.txtStatus =
                                        'TXT file restored';

                                });

                            } else {

                                this.zone.run(() => {

                                    this.txtStatus =
                                        'TXT file found. Select it again if permission is needed.';

                                });

                            }

                        } catch (error) {

                            console.error(
                                'Could not access Machine 2 TXT file:',
                                error
                            );

                        }

                    };

            };

        } catch (error) {

            console.error(
                'Could not restore Machine 2 TXT file:',
                error
            );

        }

    }


    // ==========================================
    // SAVE TXT FILE
    // ==========================================

    private async saveTxtFile(): Promise<void> {

        if (!this.txtFileHandle) {

            console.log(
                'No Machine 2 TXT file selected.'
            );

            return;

        }


        try {

            const writable =
                await this.txtFileHandle.createWritable();


            await writable.write(
                this.txtFileContent
            );


            await writable.close();


            console.log(
                '===== MACHINE 2 TXT FILE UPDATED ====='
            );


            console.log(
                this.txtFileContent
            );

        } catch (error) {

            console.error(
                'Could not save Machine 2 TXT file:',
                error
            );

        }

    }


    // ==========================================
    // DELETE EVERYTHING
    // ==========================================

    async deleteAll(): Promise<void> {

        console.log(
            '===== DELETE ALL MACHINE 2 DATA ====='
        );


        // ======================================
        // 1. CLEAR FRONTEND ARRAY
        // ======================================

        this.zone.run(() => {

            this.receivedMessages = [];

        });


        // ======================================
        // 2. CLEAR LOCAL STORAGE
        // ======================================

        localStorage.removeItem(
            'receivedMessages'
        );


        // ======================================
        // 3. CLEAR TXT CONTENT
        // ======================================

        this.txtFileContent = '';


        // ======================================
        // 4. CLEAR PHYSICAL TXT FILE
        // ======================================

        if (this.txtFileHandle) {

            try {

                const writable =
                    await this.txtFileHandle.createWritable();


                await writable.write('');


                await writable.close();


                console.log(
                    '===== MACHINE 2 TXT FILE CLEARED ====='
                );


            } catch (error) {

                console.error(
                    'Could not clear Machine 2 TXT file:',
                    error
                );

            }

        }


        // ======================================
        // 5. UPDATE STATUS
        // ======================================

        this.zone.run(() => {

            this.txtStatus =
                'All received messages and TXT data deleted';

        });


        console.log(
            '===== MACHINE 2 DELETE ALL COMPLETE ====='
        );

    }

}