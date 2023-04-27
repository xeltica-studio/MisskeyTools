import { styled } from '@/libs/stitches.js';

/**
 * ユーザーからの値入力を受け付ける。
 */
export const Select = styled('select', {
  padding: '$xs $m',
  borderRadius: '$2',
  background: '$card',
  color: '$fg',
  fontSize: '$m',
  border: '1px solid $divider',
  transition: 'all 0.2s ease',

  '&:focus': {
    borderColor: '$primary',
    boxShadow: '0 0 0 1px $colors$primary',
  },

  variants: {
    error: {
      true: {
        color: '$danger',
        borderColor: '$danger',
        '&:focus': {
          borderColor: '$danger',
          boxShadow: '0 0 0 1px $colors$danger',
        },
      },
    },
  },
});
