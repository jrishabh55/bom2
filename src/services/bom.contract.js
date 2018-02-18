import { BomApiService } from './bomApi.service';

class BomContract {

    async searchPart(data) {
        return BomApiService.post('/shopelect-v8/_search', data).then(res => res.hits.hits);
    }

}

const instance = new BomContract();
export { instance as BomContract };
