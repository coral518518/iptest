import { IDisposer, deepObserve } from "mobx-utils";
import { SAVED_IPS_FILEPATH, readFile, writeFile } from "@/storage/fileAccess";
import { getStoredJson, storeJson } from "@/storage/localStorage";
import { debounce } from "lodash-es";
import { SavedIpsMap } from "./SavedIps";
import { StorageSync } from "./StorageSync";

const STORAGE_KEY_SAVED_IPS = "cf-ip-tester-app__saved-ips";

export class SavedIpsStorageSync implements StorageSync {
  private filePath = SAVED_IPS_FILEPATH;

  private unsubscribeSaveToLocalStorage: IDisposer | undefined;
  private unsubscribeSaveToDevice: IDisposer | undefined;
  private savedIps: SavedIpsMap;

  constructor(data: SavedIpsMap) {
    this.savedIps = data;
  }

  public async mergedDeviceDataWithStorage() {
    const deviceData = await this.getDeviceData();
    const storageData = await getStoredJson<SavedIpsMap>(
      STORAGE_KEY_SAVED_IPS,
      {}
    );
    // For saved IPs, we just merge keys. If both exist, keep the one from storage (or device, doesn't matter much)
    const result = { ...deviceData, ...storageData };
    return result;
  }

  public async getDeviceData(): Promise<SavedIpsMap> {
    const jsonStr = await readFile(this.filePath);
    if (!jsonStr) {
      return {};
    }
    let result = {};
    try {
      result = JSON.parse(jsonStr);
    } catch (error) {
      return {};
    }
    return result;
  }

  public async resetDeviceData() {
    await writeFile(this.filePath, "");
  }

  public async resetStorageData() {
    await storeJson(STORAGE_KEY_SAVED_IPS, {});
  }

  public async autoSaveToLocalStorage() {
    const result = await this.mergedDeviceDataWithStorage();
    this.unsubscribeSaveToLocalStorage = deepObserve(this.savedIps, () => {
      storeJson(STORAGE_KEY_SAVED_IPS, this.savedIps);
    });
    return result;
  }

  public async autoSaveToDevice() {
    const result = await this.mergedDeviceDataWithStorage();
    this.unsubscribeSaveToDevice = deepObserve(
      this.savedIps,
      debounce(
        () => {
          writeFile(this.filePath, JSON.stringify(this.savedIps));
        },
        3000,
        { leading: true, trailing: true, maxWait: 5000 }
      )
    );
    return result;
  }

  public async changeStoragePlace(isSaveDataToDevice: boolean) {
    if (isSaveDataToDevice) {
      const result = await this.autoSaveToDevice();
      this.unsubscribeSaveToLocalStorage?.();
      this.resetStorageData();
      return result;
    }
    const result = await this.autoSaveToLocalStorage();
    this.unsubscribeSaveToDevice?.();
    this.resetDeviceData();
    return result;
  }

  public async clear() {
    await this.resetDeviceData();
    await this.resetStorageData();
  }
}
