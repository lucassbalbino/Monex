
import React from 'react';
import { Button } from '@/components/ui/button';
import { RefreshCw, AlertTriangle } from 'lucide-react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Uncaught error:", error, errorInfo);
    this.setState({ error, errorInfo });
  }

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#0F172A] text-white flex flex-col items-center justify-center p-6 text-center">
          <div className="bg-red-500/10 p-6 rounded-full mb-6 border border-red-500/20">
            <AlertTriangle className="h-12 w-12 text-red-500" />
          </div>
          <h1 className="text-3xl font-bold mb-2">Ops! Algo deu errado.</h1>
          <p className="text-gray-400 max-w-md mb-8">
            Encontramos um erro inesperado ao carregar esta página. Tente recarregar para continuar.
          </p>
          
          <div className="bg-[#1E293B] p-4 rounded-lg text-left max-w-lg w-full mb-8 overflow-auto max-h-48 border border-[#334155]">
            <p className="text-red-400 font-mono text-sm break-all">
              {this.state.error?.toString()}
            </p>
          </div>

          <Button 
            onClick={this.handleReload}
            className="bg-[#14B8A6] hover:bg-[#0D9488] text-white px-8"
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Recarregar Página
          </Button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
