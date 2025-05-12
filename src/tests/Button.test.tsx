
import { render, screen, fireEvent } from '@testing-library/react';
import { Button } from '@/components/ui/button';
import { Mail } from 'lucide-react';
import { AuthContext } from '@/contexts/AuthContext';

// Mock Lucide icons
jest.mock('lucide-react', () => ({
  Loader2: () => <div data-testid="loader-icon">Loader Icon</div>,
  Mail: () => <div data-testid="mail-icon">Mail Icon</div>,
}));

// Mock AuthContext
const mockAuthContext = {
  user: null,
  isLoading: false,
  login: jest.fn(),
  logout: jest.fn(),
  favoriteColor: 'purple',
  setFavoriteColor: jest.fn(),
};

describe('Button Component', () => {
  test('renders correctly with default props', () => {
    render(<Button>Click Me</Button>);
    const button = screen.getByRole('button', { name: /click me/i });
    expect(button).toBeInTheDocument();
  });

  test('applies correct variant class', () => {
    render(<Button variant="destructive">Delete</Button>);
    const button = screen.getByRole('button', { name: /delete/i });
    expect(button).toHaveClass('bg-destructive');
  });

  test('applies correct size class', () => {
    render(<Button size="lg">Large Button</Button>);
    const button = screen.getByRole('button', { name: /large button/i });
    expect(button).toHaveClass('h-11');
  });

  test('can be disabled', () => {
    render(<Button disabled>Disabled</Button>);
    const button = screen.getByRole('button', { name: /disabled/i });
    expect(button).toBeDisabled();
  });

  test('shows loader when loading', () => {
    render(<Button loading>Loading</Button>);
    expect(screen.getByTestId('loader-icon')).toBeInTheDocument();
  });

  test('renders icon in correct position', () => {
    render(<Button icon={<Mail />} iconPosition="start">With Icon</Button>);
    const button = screen.getByRole('button', { name: /with icon/i });
    const icon = screen.getByTestId('mail-icon');
    expect(button).toContainElement(icon);
    
    // Check icon position (this is a simplified check)
    const buttonHTML = button.innerHTML;
    const iconIndex = buttonHTML.indexOf('mail-icon');
    const textIndex = buttonHTML.indexOf('With Icon');
    expect(iconIndex).toBeLessThan(textIndex);
  });

  test('applies fullWidth class when specified', () => {
    render(<Button fullWidth>Full Width</Button>);
    const button = screen.getByRole('button', { name: /full width/i });
    expect(button).toHaveClass('w-full');
  });

  test('applies dynamic color classes when color prop is used', () => {
    render(<Button color="blue">Blue Button</Button>);
    const button = screen.getByRole('button', { name: /blue button/i });
    expect(button.className).toMatch(/bg-blue-600/);
  });

  test('uses user favorite color when useUserColor is true', () => {
    render(
      <AuthContext.Provider value={mockAuthContext}>
        <Button useUserColor>Themed Button</Button>
      </AuthContext.Provider>
    );
    const button = screen.getByRole('button', { name: /themed button/i });
    expect(button).toHaveClass('bg-purple-600');
  });

  test('calls onClick handler when clicked', () => {
    const handleClick = jest.fn();
    render(<Button onClick={handleClick}>Click Handler</Button>);
    const button = screen.getByRole('button', { name: /click handler/i });
    fireEvent.click(button);
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  test('does not call onClick when disabled', () => {
    const handleClick = jest.fn();
    render(<Button onClick={handleClick} disabled>Disabled Button</Button>);
    const button = screen.getByRole('button', { name: /disabled button/i });
    fireEvent.click(button);
    expect(handleClick).not.toHaveBeenCalled();
  });

  test('does not call onClick when loading', () => {
    const handleClick = jest.fn();
    render(<Button onClick={handleClick} loading>Loading Button</Button>);
    const button = screen.getByRole('button', { name: /loading button/i });
    fireEvent.click(button);
    expect(handleClick).not.toHaveBeenCalled();
  });
});
