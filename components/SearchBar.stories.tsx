import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { View } from 'react-native';
import { SearchBar } from './SearchBar';

const meta: Meta<typeof SearchBar> = {
  title: 'components/SearchBar',
  component: SearchBar,
};
export default meta;

type Story = StoryObj<typeof SearchBar>;

function Interactive({ initialValue = '', initialSearched = false }: { initialValue?: string; initialSearched?: boolean }) {
  const [value, setValue] = useState(initialValue);
  const [searched, setSearched] = useState(initialSearched);
  return (
    <View style={{ width: 320 }}>
      <SearchBar
        value={value}
        onChangeText={setValue}
        onSubmit={() => setSearched(true)}
        onClear={() => setSearched(false)}
        searched={searched && value.length > 0}
      />
    </View>
  );
}

export const Empty: Story = { render: () => <Interactive /> };
export const Default: Story = { render: () => <Interactive initialValue="Perdón" /> };
export const Searched: Story = { render: () => <Interactive initialValue="Milagro" initialSearched /> };
