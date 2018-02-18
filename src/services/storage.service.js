class StorageService {

  constructor() {
    this.provider = localStorage;
  }

  getItem(item, $default = '') {
    return this.provider.getItem(item) || $default;
  }

  setItem(key, value) {
    return this.provider.setItem(key, value);
  }

  removeItem(item) {
    return this.provider.removeItem(item);
  }

  clear(key) {
    return this.provider.clear();
  }

  setProvider(provider) {
    this.provider = provider;
  }

}

const instance  = new StorageService();
export { instance as StorageService }
