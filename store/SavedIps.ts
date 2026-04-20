import { userSettingsStore } from "@/store/UserSettings";
import { CfIpResponse } from "@/screens/TestRunScreen/model";
import { action, makeObservable, observable, reaction } from "mobx";
import { SavedIpsStorageSync } from "./SavedIpsStorageSync";

export type SavedIpsMap = Record<string, CfIpResponse>;

export class SavedIps {
  readonly savedIps: SavedIpsMap = {};
  private storageSync: SavedIpsStorageSync;

  constructor() {
    makeObservable(this, {
      savedIps: observable,
      changeSavedIps: action,
      addSavedIp: action,
      removeSavedIp: action,
      clear: action,
    });
    this.storageSync = new SavedIpsStorageSync(this.savedIps);
    this.storageSync
      .mergedDeviceDataWithStorage()
      .then((savedIps) => {
        this.changeSavedIps(savedIps);
        reaction(
          () => userSettingsStore.userSetting.isSaveDataToDevice,
          async (isSaveDataToDevice) => {
            const result = await this.storageSync.changeStoragePlace(
              isSaveDataToDevice
            );
            this.changeSavedIps(result);
          },
          { fireImmediately: true }
        );
      })
      .catch((err) => {
        console.log(err, "merge saved ips failed");
      });
  }

  changeSavedIps(savedIps: SavedIpsMap) {
    Object.keys(this.savedIps).forEach((key) => {
      delete this.savedIps[key];
    });
    Object.keys(savedIps).forEach((key) => {
      this.savedIps[key] = savedIps[key];
    });
  }

  addSavedIp(cfIpResponse: CfIpResponse) {
    this.savedIps[cfIpResponse.ip] = { ...cfIpResponse };
  }

  removeSavedIp(ip: string) {
    delete this.savedIps[ip];
  }

  async clear() {
    Object.keys(this.savedIps).forEach((key) => {
      delete this.savedIps[key];
    });
    await this.storageSync.clear();
  }

  get savedIpList(): CfIpResponse[] {
    return Object.values(this.savedIps);
  }
}

const savedIpsStore = new SavedIps();

export { savedIpsStore };
