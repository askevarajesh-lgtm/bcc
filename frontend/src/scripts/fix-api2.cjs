const fs = require('fs');
let file = fs.readFileSync('e:/Bcc Seo/frontend/src/api/projectApi.js', 'utf8');

const additional = `
export const useSubmitForClientReviewMutation = createMutationHook((id) => ({ url: \`/projects/\${id}/submit-review\`, method: 'POST' }));
export const useClientApproveMutation = createMutationHook((id) => ({ url: \`/projects/\${id}/client-approve\`, method: 'POST' }));
export const useApproveWorkflowMutation = createMutationHook((id) => ({ url: \`/projects/\${id}/approve-workflow\`, method: 'POST' }));
export const useRequestWorkflowRevisionMutation = createMutationHook((id) => ({ url: \`/projects/\${id}/request-revision\`, method: 'POST' }));
export const useCompleteProjectMutation = createMutationHook((id) => ({ url: \`/projects/\${id}/complete\`, method: 'POST' }));
export const useReopenProjectMutation = createMutationHook((id) => ({ url: \`/projects/\${id}/reopen\`, method: 'POST' }));
export const useActivateProjectMutation = createMutationHook((id) => ({ url: \`/projects/\${id}/activate\`, method: 'POST' }));
export const useDeactivateProjectMutation = createMutationHook((id) => ({ url: \`/projects/\${id}/deactivate\`, method: 'POST' }));
export const useUpdateProjectMilestonesMutation = createMutationHook(({ id, ...data }) => ({ url: \`/projects/\${id}/milestones\`, method: 'PUT', data }));
`;

if (!file.includes('useSubmitForClientReviewMutation')) {
  fs.appendFileSync('e:/Bcc Seo/frontend/src/api/projectApi.js', additional);
}
