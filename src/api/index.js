export const getData = function(sku_num) {
	console.log('sss=', sku_num);
	return fetch('https://scalr.api.appbase.io/shopelect-v8/_search', {
		method: 'POST',
		headers: {
			Authorization: 'Basic dkpTM3VsQmRKOmNmNjA3MmJhLTM3MWQtNDFkOC04Njg0LTU1NGY1ZmJjZTU3ZQ==',
			'Content-Type': 'application/json'
		},
		body: JSON.stringify({
			query: {
				term: {
					'company_sku.raw': sku_num
				}
			}
		})
	})
		.then((response) => response.json())
		.then((response) => {
			console.log(response);
			console.log('____');
			return response.hits.hits[0];
		})
		.catch((error) => {
			console.error('api error: ', error);
		});
};
export const getInfo = function(sku_num) {
	return fetch('https://scalr.api.appbase.io/shopelect-v8/_search', {
		method: 'POST',
		headers: {
			Authorization: 'Basic dkpTM3VsQmRKOmNmNjA3MmJhLTM3MWQtNDFkOC04Njg0LTU1NGY1ZmJjZTU3ZQ==',
			'Content-Type': 'application/json'
		},
		body: JSON.stringify({
			query: {
				match_phrase_prefix: {
					company_sku: sku_num
				}
			}
		})
	})
		.then((response) => response.json())
		.then((response) => {
			return response.hits.hits;
		})
		.catch((error) => {
			console.error('api error: ', error);
		});
};
export const getPrefix = function(sku_num) {
	console.log('SKYU=', sku_num);
	return fetch('https://scalr.api.appbase.io/shopelect-v8/_search', {
		method: 'POST',
		headers: {
			Authorization: 'Basic dkpTM3VsQmRKOmNmNjA3MmJhLTM3MWQtNDFkOC04Njg0LTU1NGY1ZmJjZTU3ZQ==',
			'Content-Type': 'application/json'
		},
		body: JSON.stringify({
			query: {
				match_phrase_prefix: {
					company_sku: sku_num
				}
			}
		})
	})
		.then((response) => response.json())
		.then((response) => {
			console.log('Resp', response);
			return response.hits.hits.slice(0, 10).map((hit, index) => hit._source.company_sku);
		})
		.catch((error) => {
			console.error('api error: ', error);
		});
};
