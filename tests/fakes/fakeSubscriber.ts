import { EventEmitter } from "events";

export class FakeSubscriber extends EventEmitter {
  public subscribedChannels: string[] = [];

  async subscribe(channel: string) {
    this.subscribedChannels.push(channel);
    return 1;
  }

  async unsubscribe(channel: string) {
    this.subscribedChannels = this.subscribedChannels.filter((c) => c !== channel);
    return 0;
  }

  off(eventName: string | symbol, listener: (...args: any[]) => void) {
    this.removeListener(eventName, listener);
    return this;
  }

  async quit() {
    this.removeAllListeners();
    return "OK";
  }
}
