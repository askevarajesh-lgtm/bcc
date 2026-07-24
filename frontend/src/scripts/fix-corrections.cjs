const fs = require('fs');
let file = fs.readFileSync('e:/Bcc Seo/frontend/src/api/correctionApi.js', 'utf8');

const additional = `
const createQueryHook = (endpointFn) => {
  return (params, options = {}) => {
    const { skip } = options;
    const [data, setData] = require('react').useState(null);
    const [isLoading, setIsLoading] = require('react').useState(!skip);
    const [error, setError] = require('react').useState(null);

    const refetch = require('react').useCallback(async () => {
      if (skip) return;
      setIsLoading(true);
      try {
        const config = typeof endpointFn === 'function' ? endpointFn(params) : { url: endpointFn };
        const url = typeof config === 'string' ? config : config.url;
        const queryParams = typeof config === 'object' && config.params ? config.params : {};
        
        const response = await api.get(url, { params: queryParams });
        setData(response.data);
        setError(null);
      } catch (err) {
        setError(err);
      } finally {
        setIsLoading(false);
      }
    }, [JSON.stringify(params), skip]);

    require('react').useEffect(() => {
      refetch();
    }, [refetch]);

    return { data, isLoading, error, refetch };
  };
};

export const useGetCorrectionsByProjectQuery = createQueryHook((id) => \`/projects/\${id}/corrections\`);
export const useRequestCorrectionMutation = () => { return [async () => ({}), { isLoading: false }]; };
export const useDeleteCorrectionMutation = () => { return [async () => ({}), { isLoading: false }]; };
`;

if (!file.includes('useGetCorrectionsByProjectQuery')) {
  fs.appendFileSync('e:/Bcc Seo/frontend/src/api/correctionApi.js', additional);
}
