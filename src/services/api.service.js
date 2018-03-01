import { StorageService } from './storage.service';
import { AuthService } from './auth.service';

export const contract = {
  host: "https://middleware.shopelect.com",
  port: 443,
  prefix: ""
};

class ApiService {

  constructor () {

    this.key = StorageService.getItem('access_token');

    this.headers = {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + this.key
    };

  }

  async get(url, query) {
    return fetch(this.buildUrl(url, query), { headers: this.headers}).then(this.parse);
  }

  async post(url, body) {
    return fetch(this.buildUrl(url), {
      method: 'POST',
      headers: this.headers,
      body: JSON.stringify(body)
    }).then(this.parse);
  }

  async put(url, body) {
    return fetch(this.buildUrl(url), {
      method: 'PUT',
      headers: this.headers,
      body: JSON.stringify(body)
    }).then(this.parse);
  }

  async delete(url, query) {
    return fetch(this.buildUrl(url, query), { method: 'DELETE', headers: this.headers }).then(this.parse);
  }

  buildUrl(url, $query) {
    let query = [];

    if (query && typeof $query === 'object') {
      for (let key in $query) {
        query.push(`${key}=${$query[key]}`);
      }
    }

    const sufix = query.length > 0 ? `?${query.join('&')}` : '';

    return `${contract.host}:${contract.port}${contract.prefix}${url}${sufix}`;
  }

  async addComment({ bom_id, item_id, msg }) {
    return this.post(`/bom/${bom_id}/comment/${item_id}`, {
      by: AuthService.user().name,
      text: msg
    }).then(this.parse);
  }

  async fetchComments({ bom_id, item_id }) {
    return this.get(`/bom/${bom_id}/comment/${item_id}`).then(this.parse);
  }

  parse(res) {
    if (res.status >= 400) {
      throw new Error("Invalid authentication");
    } else {
      try {
          return res.json();
      } catch (e) {
        console.error(e);
        console.log(res);
        return res;
      }
    }
  }
}

const instance = new ApiService();
export { instance as ApiService }
