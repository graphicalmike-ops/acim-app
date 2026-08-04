import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { View } from 'react-native';
import { NoteInput } from './NoteInput';

const meta: Meta<typeof NoteInput> = {
  title: 'components/NoteInput',
  component: NoteInput,
};
export default meta;

type Story = StoryObj<typeof NoteInput>;

function Interactive({ initialValue = '' }: { initialValue?: string }) {
  const [value, setValue] = useState(initialValue);
  return (
    <View style={{ width: 320 }}>
      <NoteInput value={value} onChangeText={setValue} onSubmit={() => {}} />
    </View>
  );
}

export const Empty: Story = { render: () => <Interactive /> };
export const WithText: Story = { render: () => <Interactive initialValue="Esto me recuerda a..." /> };
