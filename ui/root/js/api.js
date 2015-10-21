'use strict';

/* global ApiUrl, SiteUrl,
      Ajax, Site, Api, eventHandlers, getCookies, Cookie */

window.Ajax = {};

Ajax.request = function(method, url, json, opts, callback) {

  //jshint maxcomplexity: 9

  if (!callback) {
    callback = opts;
    opts = {};
  }

  var xhr = window.XDomainRequest ?
      new XDomainRequest() :
    window.XMLHttpRequest ?
      new XMLHttpRequest() :
    null;

  xhr.crossDomain = true;

  if (opts.query) {
    var query = [];

    for (var key in opts.query) {
      query.push(encodeURIComponent(key) + '=' + encodeURIComponent(opts.query[key]));
    }

    url += '?' + query.join('&');
  }

  xhr.open(method.toUpperCase(), url, true);

  xhr.onreadystatechange = function() {
    if (xhr.readyState === 4) {
      try {
        callback(
          !xhr.status ? 'connection failed' : xhr.status === 200 ? null : xhr.status,
          xhr.responseText ? JSON.parse(xhr.responseText) : ''
        );
      } catch (err) {
        callback(err);
      }
    }
  };

  xhr.setRequestHeader('Content-Type', 'application/json;charset=utf-8');

  if (opts.headers) {
    for (var hkey in opts.headers) {
      xhr.setRequestHeader(hkey, opts.headers[hkey]);
    }
  }

  if (json) xhr.send(JSON.stringify(json));
  else xhr.send();

  return xhr;
};

Ajax.get = function(url, opts, callback) {return Ajax.request('get', url, null, opts, callback);};

Ajax.put = function(url, json, opts, callback) {return Ajax.request('put', url, json, opts, callback);};

Ajax.post = function(url, json, opts, callback) {return Ajax.request('post', url, json, opts, callback);};

Ajax.delete = function(url, opts, callback) {return Ajax.request('delete', url, null, opts, callback);};

window.Api = {name: 'api'};

Api.get = function(url, opts, callback) {return Ajax.get(ApiUrl + url, opts, callback);};

Api.put = function(url, json, opts, callback) {return Ajax.put(ApiUrl + url, json, opts, callback);};

Api.post = function(url, json, opts, callback) {return Ajax.post(ApiUrl + url, json, opts, callback);};

Api.delete = function(url, opts, callback) {return Ajax.delete(ApiUrl + url, opts, callback);};

window.Site = {name: 'site'};

Site.get = function(url, opts, callback) {return Ajax.get(SiteUrl + url, opts, callback);};

Site.put = function(url, json, opts, callback) {return Ajax.put(SiteUrl + url, json, opts, callback);};

Site.post = function(url, json, opts, callback) {return Ajax.post(SiteUrl + url, json, opts, callback);};

Site.delete = function(url, opts, callback) {return Ajax.delete(SiteUrl + url, opts, callback);};

if (!window.addEventListener) window.addEventListener = function(name, handler) {
  if (!window.eventHandlers) window.eventHandlers = {};
  var handlers = eventHandlers[name];
  if (!handlers) eventHandlers[name] = handlers = [];
  handlers.push(handler);

  var result;

  if (!window['on' + name]) window['on' + name] = function(event) {
    for (var idx = 0; idx < handlers.length; idx++) {
      result = handlers[idx](event);
      if (result === false) return result;
    }

    return result;
  };
};

window.getCookies = function() {
  var cookies = {};

  document.cookie.split(/; ?/g).forEach(function(item) {
    var ents = item.match(/^([^=]*)=(.*)$/);
    if (ents) cookies[ents[1]] = ents[2];
  });

  return cookies;
};

window.Cookie = getCookies();

window.setCookie = function(key, value, opts) {
  if (!opts) opts = {};
  var sfx = '';

  if (value == null) {
    value = '';
    opts.expires = new Date(1).toString();
    delete Cookie[key];
  } else {
    Cookie[key] = value;
  }

  for (var opt in opts) sfx += '; ' + opt + '=' + opts[opt];
  document.cookie = key + '=' + encodeURIComponent(value) + sfx;
};
