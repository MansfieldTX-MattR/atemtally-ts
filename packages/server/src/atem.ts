// import type {  } from 'atem-connection';
// import type { Event}
import { EventEmitter } from 'node:events';
import { Atem, AtemState, AtemConnectionStatus } from 'atem-connection';

import type { Tally } from '@atemtally/common';
import { TallyCollection } from './tally';

type AtemAddress = string;



interface AtemCoreEventPromises {
  connected: Promise<void>;
  disconnected: Promise<void>;
  error: Promise<string>;
  // connectionState: Promise<AtemConnectionStatus>;
}

interface AtemEvents {
  connected: [];
  disconnected: [];
  statusChanged: [AtemConnectionStatus];
  stateChanged: [AtemState];
  error: [string];
  tallyUpdated: [Tally[]];
}


export class AtemController extends EventEmitter<AtemEvents> {
  private atem: Atem;
  readonly address: AtemAddress;
  readonly tallyCollection: TallyCollection;

  constructor(address: AtemAddress) {
    super();
    this.address = address;
    this.atem = new Atem();
    this.tallyCollection = new TallyCollection();
    this.tallyCollection.on('tallyUpdated', (tallies) => {
      // this.emit('tallyUpdated', tally);
      // console.log('Tally updated:', tallies);
      this.emit('tallyUpdated', tallies);
    });
    // this.coreEvents = {
    //   connected: new Promise((resolve) => {
    //     this.atem.on('connected', resolve);
    //   }),
    //   disconnected: new Promise((resolve) => {
    //     this.atem.on('disconnected', resolve);
    //   }),
    //   error: new Promise((resolve) => {
    //     this.atem.on('error', (error) => resolve(error));
    //   }),
    // };
    this.atem.on('connected', () => {
      this.emit('connected');
      this.emit('statusChanged', this.atem.status);
    });
    this.atem.on('disconnected', () => {
      this.emit('disconnected');
      this.emit('statusChanged', this.atem.status);
    });

    this.atem.on('error', (error) => {
      this.emit('error', error);
      this.emit('statusChanged', this.atem.status);
    });
    this.atem.on('stateChanged', (state) => this.onStateChange(state));
  }

  async connect(): Promise<void> {
    try {
      const connectionPromise = new Promise<void>((resolve, reject) => {
        this.atem.once('connected', () => {
          console.log(`ATEM connected event received for ${this.address}`);
          resolve();
        });
        this.atem.once('error', (error) => {
          console.error(`ATEM error event received for ${this.address}:`, error);
          reject(error);
        });
      });
      await this.atem.connect(this.address);
      // await this.coreEvents.connected;
      await connectionPromise;
      if (this.atem.status !== AtemConnectionStatus.CONNECTED) {
        throw new Error(`Failed to connect to ATEM at ${this.address}`);
      }
      console.log(`Connected to ATEM at ${this.address}`);
      const state = this.atem.state;
      if (state === undefined) {
        throw new Error(`Failed to retrieve state from ATEM at ${this.address}`);
      }
      this.tallyCollection.initialize(this.atem, state);
    } catch (error) {
      console.error(`Failed to connect to ATEM at ${this.address}:`, error);
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    try {
      await this.atem.disconnect();
      console.log(`Disconnected from ATEM at ${this.address}`);
    } catch (error) {
      console.error(`Failed to disconnect from ATEM at ${this.address}:`, error);
      throw error;
    }
  }

  get connected(): boolean {
    return this.atem.status === AtemConnectionStatus.CONNECTED;
  }

  onStateChange(state: AtemState): void {
    // console.log('ATEM state changed:', state);
    this.tallyCollection.updateTallies(this.atem, 0);
  }
}
