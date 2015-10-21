'use strict';

module.exports = {
  badArgument: {code: 422, message: 'Bad request argument provided'},
  badAuth: {code: 401, message: 'Bad auth data provided'},
  badEmail: {code: 409, message: 'Email is not valid'},
  badGimbalId: {code: 409, message: 'Gimbal Transmitter/Receiver ID must be non-empty string of a-z, A-Z, 0-9, _, -'},
  badName: {code: 409, message: 'Name is not valid (must be at least 3 chars)'},
  badPassword: {code: 409, message: 'Password is not valid (must be at least 6 chars)'},
  badReporterId: {code: 409, message: 'Reporter ID must be enough long (>=16 characters) ' +
    'and consist of a-z, A-Z, 0-9, _, -'},
  badToken: {code: 401, message: 'Auth Token is missing, expired or invalid'},
  denied: {code: 403, message: 'Access to resource is denied'},
  exists: {code: 409, message: 'Resource already exists'},
  locked: {code: 403, message: 'API is locked'},
  notFound: {code: 404, message: 'Resource not found'},
};
