import api from './client';

console.log('[Interceptor] loading, __DEV__ =', __DEV__);

if (__DEV__) {
  console.log('[Interceptor] registering request/response interceptors');
  api.interceptors.request.use(request => {
    console.log('\n🚀 REQUEST ─────────────────────────────');
    console.log(
      `   ${request.method?.toUpperCase()} ${request.baseURL}${request.url}`,
    );
    if (request.params && Object.keys(request.params).length > 0) {
      console.log('   PARAMS:', JSON.stringify(request.params, null, 2));
    }
    if (request.data) {
      console.log('   BODY:  ', JSON.stringify(request.data, null, 2));
    }
    console.log('────────────────────────────────────────\n');
    return request;
  });

  api.interceptors.response.use(
    response => {
      console.log('\n✅ RESPONSE ─────────────────────────────');
      console.log(
        `   ${response.status} ${response.config?.method?.toUpperCase()} ${response.config?.url}`,
      );
      console.log('   DATA:', JSON.stringify(response.data, null, 2));
      console.log('─────────────────────────────────────────\n');
      return response;
    },
    error => {
      console.log('\n❌ ERROR ────────────────────────────────');
      console.log(
        `   ${error.response?.status} ${error.config?.method?.toUpperCase()} ${error.config?.url}`,
      );
      console.log(
        '   ERROR DATA:',
        JSON.stringify(error.response?.data, null, 2),
      );
      console.log('────────────────────────────────────────\n');
      return Promise.reject(error);
    },
  );
}
