import { message } from 'antd';

// Provide keyed messages so one operation's notifications overwrite each other
export const opKey = (op, id) => `task-op:${op}:${id || 'global'}`;

export const notifyLoading = (op, id, content = 'Processing...') => {
  message.loading({ content, key: opKey(op, id), duration: 0 });
};

export const notifySuccess = (op, id, content = 'Success') => {
  message.success({ content, key: opKey(op, id), duration: 2 });
};

export const notifyError = (op, id, content = 'Failed') => {
  message.error({ content, key: opKey(op, id), duration: 4 });
};

export default {
  opKey,
  notifyLoading,
  notifySuccess,
  notifyError,
};
