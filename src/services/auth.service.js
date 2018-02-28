import { ApiService } from './api.service';
import { StorageService } from './storage.service';
import { history } from '../helpers';
class AuthService {

    constructor() {
        this.User = undefined;
        this.checkUser.bind(this);
        this.register.bind(this);
    }

    async checkUser(value = '', type = 'number') {
        return fetch(ApiService.buildUrl(`/login`, { [type]: value })).then(ApiService.parse);
    }

    async register(data) {
        return fetch(ApiService.buildUrl(`/contacts`), {
            method: 'POST',
            body: JSON.stringify(data),
            headers: {
                'Content-Type': 'application/json'
            }
        }).then(ApiService.parse);
    }

    async fetchUser($id) {
        const id = $id || StorageService.getItem('contactId');
        return fetch(ApiService.buildUrl(`/contacts/${id}`))
        .then(ApiService.parse)
        .then(res => {
            const data = res.contact;
            this.User = {
                id: data.contact_id,
                name: data.contact_persons[0].first_name + ' ' + data.contact_persons[0].last_name,
                first_name: data.contact_persons[0].first_name,
                last_name: data.contact_persons[0].last_name,
                email: data.contact_persons[0].email,
                phone: data.contact_persons[0].phone,
                photo: data.contact_persons[0].photo_url,
                type: data.contact_type,
                companyType: data.cf_type_of_company,
                numberOfEmployees: data.cf_number_of_employees,
                city: data.cf_city_of_supply,
                purpose: data.cf_purpose,
                tentativeOrderDate: data.cf_tentative_order_date,
            };

            StorageService.setItem('user', JSON.stringify(this.User));
        });
    }

    user (forceUpdate = false) {
        if (!this.User) {
            this.User = JSON.parse(StorageService.getItem('user', {}));
        }

        return this.User;
    }

    isAuthenticated() {
        return StorageService.getItem('access_token') && StorageService.getItem('expires_at') > Date.now();
    }

    logout() {
        StorageService.clear();
        history.push('/login');
    }
}

const instance = new AuthService();
export { instance as AuthService };
