
import React from 'react';
import { Meta, StoryObj } from '@storybook/react';
import { ImpressumMapping } from '@/components/ImpressumMapping';
import { action } from '@storybook/addon-actions';

const meta: Meta<typeof ImpressumMapping> = {
  title: 'Components/ImpressumMapping',
  component: ImpressumMapping,
  parameters: {
    layout: 'centered',
  },
  argTypes: {
    onSubmit: { action: 'submitted' },
  },
};

export default meta;
type Story = StoryObj<typeof ImpressumMapping>;

export const Default: Story = {
  args: {
    data: {
      company: 'Example Company GmbH',
      address: 'Example Street 123, 12345 Berlin',
      phone: '+49 30 12345678',
      email: 'info@example.com',
      ceos: ['John Doe', 'Jane Smith'],
      source: 'https://example.com/impressum',
    },
    confidenceScores: {
      company: 'high',
      address: 'medium',
      phone: 'high',
      email: 'high',
    },
    onSubmit: async (data) => {
      action('submitted')(data);
      return Promise.resolve();
    },
    isLoading: false,
  },
};

export const WithoutCEOs: Story = {
  args: {
    data: {
      company: 'Solo Company Ltd',
      address: '123 Solo Street, London',
      phone: '+44 20 12345678',
      email: 'contact@solocompany.co.uk',
      ceos: [],
      source: 'https://solocompany.co.uk/imprint',
    },
    confidenceScores: {
      company: 'medium',
      address: 'medium',
      phone: 'medium',
      email: 'high',
    },
    onSubmit: async (data) => {
      action('submitted')(data);
      return Promise.resolve();
    },
    isLoading: false,
  },
};

export const Loading: Story = {
  args: {
    data: {
      company: 'Example Company GmbH',
      address: 'Example Street 123, 12345 Berlin',
      phone: '+49 30 12345678',
      email: 'info@example.com',
      ceos: ['John Doe', 'Jane Smith'],
      source: 'https://example.com/impressum',
    },
    confidenceScores: {
      company: 'high',
      address: 'medium',
      phone: 'high',
      email: 'high',
    },
    onSubmit: async (data) => {
      action('submitted')(data);
      return new Promise(resolve => setTimeout(resolve, 2000));
    },
    isLoading: true,
  },
};

export const LowConfidence: Story = {
  args: {
    data: {
      company: 'Unclear Entity',
      address: 'Somewhere',
      phone: '12345',
      email: 'contact@unclear',
      ceos: ['Unknown Person'],
      source: 'https://unclear.com/about',
    },
    confidenceScores: {
      company: 'low',
      address: 'low',
      phone: 'low',
      email: 'low',
    },
    onSubmit: async (data) => {
      action('submitted')(data);
      return Promise.resolve();
    },
    isLoading: false,
  },
};
