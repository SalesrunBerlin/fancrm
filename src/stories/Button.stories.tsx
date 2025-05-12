
import { Meta, StoryObj } from "@storybook/react";
import { Button } from "@/components/ui/button";
import { Loader2, Mail, ArrowRight } from "lucide-react";

const meta: Meta<typeof Button> = {
  title: "UI/Button",
  component: Button,
  argTypes: {
    variant: {
      control: "select",
      options: [
        "default",
        "solid",
        "outline",
        "ghost",
        "link",
        "destructive",
        "orange",
        "cyan",
        "purple",
      ],
    },
    size: {
      control: "select",
      options: ["xs", "sm", "md", "lg", "icon", "responsive"],
    },
    color: {
      control: "select",
      options: [
        undefined,
        "blue",
        "green",
        "red",
        "yellow",
        "purple",
        "pink",
        "orange",
        "indigo",
        "teal",
      ],
    },
    disabled: { control: "boolean" },
    loading: { control: "boolean" },
    fullWidth: { control: "boolean" },
    iconOnly: { control: "boolean" },
    useUserColor: { control: "boolean" },
  },
  args: {
    children: "Button",
    variant: "default",
    size: "md",
    disabled: false,
    loading: false,
    fullWidth: false,
    iconOnly: false,
    useUserColor: false,
  },
};

export default meta;
type Story = StoryObj<typeof Button>;

// Basic button variations
export const Default: Story = {};

export const Solid: Story = {
  args: {
    variant: "solid",
  },
};

export const Outline: Story = {
  args: {
    variant: "outline",
  },
};

export const Ghost: Story = {
  args: {
    variant: "ghost",
  },
};

export const Link: Story = {
  args: {
    variant: "link",
  },
};

export const Destructive: Story = {
  args: {
    variant: "destructive",
  },
};

// Size variations
export const ExtraSmall: Story = {
  args: {
    size: "xs",
  },
};

export const Small: Story = {
  args: {
    size: "sm",
  },
};

export const Medium: Story = {
  args: {
    size: "md",
  },
};

export const Large: Story = {
  args: {
    size: "lg",
  },
};

// State variations
export const Disabled: Story = {
  args: {
    disabled: true,
  },
};

export const Loading: Story = {
  args: {
    loading: true,
  },
};

export const FullWidth: Story = {
  args: {
    fullWidth: true,
  },
};

// With icons
export const WithLeftIcon: Story = {
  args: {
    icon: <Mail />,
    iconPosition: "start",
  },
};

export const WithRightIcon: Story = {
  args: {
    icon: <ArrowRight />,
    iconPosition: "end",
  },
};

export const IconOnly: Story = {
  args: {
    icon: <Mail />,
    iconOnly: true,
    "aria-label": "Send email",
  },
};

// Color customizations
export const CustomBlue: Story = {
  args: {
    color: "blue",
    children: "Blue Button",
  },
};

export const CustomGreen: Story = {
  args: {
    color: "green",
    variant: "outline",
    children: "Green Outline",
  },
};

export const CustomRed: Story = {
  args: {
    color: "red",
    variant: "ghost",
    children: "Red Ghost",
  },
};

// A gallery of themed buttons
export const AllColors: Story = {
  render: () => (
    <div className="flex flex-wrap gap-2">
      {["default", "blue", "green", "red", "yellow", "purple", "pink", "orange", "indigo", "teal"].map((color) => (
        <Button key={color} color={color === "default" ? undefined : color}>
          {color}
        </Button>
      ))}
    </div>
  ),
};

// A gallery of all sizes
export const AllSizes: Story = {
  render: () => (
    <div className="flex items-center gap-2">
      <Button size="xs">Extra Small</Button>
      <Button size="sm">Small</Button>
      <Button size="md">Medium</Button>
      <Button size="lg">Large</Button>
    </div>
  ),
};

// A gallery of all variants
export const AllVariants: Story = {
  render: () => (
    <div className="flex flex-wrap items-center gap-2">
      <Button variant="default">Default</Button>
      <Button variant="solid">Solid</Button>
      <Button variant="outline">Outline</Button>
      <Button variant="ghost">Ghost</Button>
      <Button variant="link">Link</Button>
      <Button variant="destructive">Destructive</Button>
      <Button variant="orange">Orange</Button>
    </div>
  ),
};
