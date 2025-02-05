export const UTF8 = /UTF-8/i.test(document.characterSet);

export const Encode = function (object) {
    if (UTF8) return object;

    let data = "";
    const keysToEncode = new Set(["edit_code", "content", "template"]);

    for (const [key, value] of Object.entries(object)) {
        if (value == null) continue; // Ignore les valeurs null ou undefined

        let encodedValue = encodeURIComponent(value);

        if (keysToEncode.has(key)) {
            encodedValue = encodeURIComponent(
                escape(value).replace(
                    /%u[A-F0-9]{4}/g,
                    (match) => `&#${parseInt(match.substr(2), 16)};`
                )
            ).replace(/%25/g, "%");
        }

        data += `${encodeURIComponent(key)}=${encodedValue}&`;
    }

    return data.slice(0, -1); // Retire le dernier "&"
};

export function capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}

export function Fetcher(url, options, body) {
    return fetch(url, this.fetchOptions(options, body));
}

Fetcher.prototype.fetchOptions = function (options, body) {
    /* setup default headers and parse of body for FA */
    const update = { ...options };
    update.headers = {
        ...update.headers,
        "Content-Type": "application/x-www-form-urlencoded",
    };
    update.body = this.bodyData(body);
    return update;
};

Fetcher.prototype.toFormData = function (obj) {
    var form_data = new FormData();

    for (var key in obj) {
        form_data.append(key, obj[key]);
    }
    return form_data;
};

Fetcher.prototype.encodeFormData = function (data) {
    return [...data.entries()]
        .map((x) => `${encodeURIComponent(x[0])}=${encodeURIComponent(x[1])}`)
        .join("&");
};

Fetcher.prototype.bodyData = function (obj) {
    // compatible data for FA with fetch
    return this.encodeFormData(this.toFormData(obj));
};
