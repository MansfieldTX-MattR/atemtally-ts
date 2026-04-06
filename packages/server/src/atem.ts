import { debug as createDebug } from "debug";
import { EventEmitter } from 'node:events';
import { Atem, AtemState, AtemConnectionStatus } from 'atem-connection';

import type { Tally } from '@atemtally/common';
import { TallyCollection } from './tally';

type AtemAddress = string;

const debug = createDebug("atemtally:atem");

const RESEND_TALLY_INTERVAL_MS = 10000; // Interval for resending tallies to TSL clients


interface AtemEvents {
  connected: [];
  disconnected: [];
  statusChanged: [AtemConnectionStatus];
  stateChanged: [AtemState];
  error: [string];
  tallyUpdated: [Tally[]];
  tallyResend: [Tally[]];
}


export class AtemController extends EventEmitter<AtemEvents> {
  private atem: Atem;
  private running: boolean = false;
  private updatingTallies: boolean = false;
  private timeoutId: NodeJS.Timeout | null = null;
  readonly address: AtemAddress;
  readonly tallyCollection: TallyCollection;

  constructor(address: AtemAddress) {
    super();
    this.updatingTallies = false;
    this.timeoutId = null;
    this.address = address;
    this.atem = new Atem();
    this.tallyCollection = new TallyCollection();
    this.tallyCollection.on('tallyUpdated', (tallies) => {
      this.emit('tallyUpdated', tallies);
    });
    this.running = true;
    this.resendTalliesPeriodically();
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
      debug(`Connected to ATEM at ${this.address}`);
      this.emit('connected');
      this.emit('statusChanged', this.atem.status);
      const state = this.atem.state;
      if (state === undefined) {
        debug(`Failed to retrieve state from ATEM at ${this.address} on connect`);
        return;
      }
      if (!this.tallyCollection.initialized) {
        this.tallyCollection.initialize(this.atem, state);
      } else {
        this.tallyCollection.updateTallies(this.atem, 0);
      }
    });
    this.atem.on('disconnected', () => {
      debug(`Disconnected from ATEM at ${this.address}`);
      this.emit('disconnected');
      this.emit('statusChanged', this.atem.status);
      this.tallyCollection.reset();
    });

    this.atem.on('error', (error) => {
      debug(`Error with ATEM at ${this.address}:`, error);
      this.emit('error', error);
      this.emit('statusChanged', this.atem.status);
    });
    this.atem.on('stateChanged', (state) => this.onStateChange(state));
  }

  private async resendTalliesPeriodically(): Promise<void> {
    while (this.running) {
      await this.delay(RESEND_TALLY_INTERVAL_MS);
      if (!this.running) {
        break;
      }
      if (this.updatingTallies) {
        debug("Skipping resend of tallies to TSL clients because we're currently updating tallies from ATEM state change");
        continue;
      }
      const tallies = this.tallyCollection.getTallies();
      debug(`Resending ${tallies.length} tallies to TSL clients...`);
      this.emit('tallyResend', tallies);
    }
  }

  private async delay(ms: number): Promise<void> {
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
    }
    return new Promise((resolve) => {
      this.timeoutId = setTimeout(() => {
        this.timeoutId = null;
        resolve();
      }, ms);
    });
  }

  async connect(): Promise<void> {
    debug(`Attempting to connect to ATEM at ${this.address}...`);
    try {
      await this.atem.connect(this.address);
    } catch (error) {
      debug(`Failed to connect to ATEM at ${this.address}:`, error);
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    this.running = false;
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
      this.timeoutId = null;
    }
    this.tallyCollection.reset();
    try {
      await this.atem.disconnect();
      debug(`Disconnected from ATEM at ${this.address}`);
    } catch (error) {
      debug(`Failed to disconnect from ATEM at ${this.address}:`, error);
      throw error;
    }
  }

  get connected(): boolean {
    return this.atem.status === AtemConnectionStatus.CONNECTED;
  }

  onStateChange(state: AtemState): void { // eslint-disable-line @typescript-eslint/no-unused-vars
    this.updatingTallies = true;
    this.tallyCollection.updateTallies(this.atem, 0);
    this.updatingTallies = false;
  }
}
