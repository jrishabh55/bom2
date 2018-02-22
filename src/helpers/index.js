import history from './history';

export { history as history};

export const env = ($key, $default = "") => process.env[$key] || $default;

export const getProp = ($obj, $key, $default = '-') => $obj ? $obj[$key] || $default : $default;

export const toCSV = (arr, header) => {
    const ser = serializeArray(arr);
    const result = ser.map(element => element.map(el => `"${el.toString()}"`).join(','));
    if (header) {
        result.unshift(header);
    }

    return result.join('\n');
}

export const serializeArray = (arr) => {
    if (!Array.isArray(arr)) {
        arr = JSON.parse(arr);
    }
    const result = [];
    result.push(Object.keys(arr[0]));
    arr.forEach(row => {
        result.push(Object.values(row));
    });

    return result;

}

export const download = (filename, data) => {
    const blob = new Blob([data], { type: 'text/csv' });
    if (window.navigator.msSaveOrOpenBlob) {
        window.navigator.msSaveBlob(blob, filename);
    }
    else {
        const elem = window.document.createElement('a');
        elem.href = window.URL.createObjectURL(blob);
        elem.download = filename;
        document.body.appendChild(elem);
        elem.click();
        document.body.removeChild(elem);
    }
}