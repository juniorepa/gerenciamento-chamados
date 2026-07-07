import React, { ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RotateCcw, Copy, Check } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  copied: boolean;
}

export class ErrorBoundary extends (React.Component as any) {
  public state: any = {
    hasError: false,
    error: null,
    errorInfo: null,
    copied: false
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null, copied: false };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
    this.setState({ errorInfo });
  }

  private handleCopy = () => {
    const errorDetails = `Error: ${this.state.error?.message}\n\nStack:\n${this.state.error?.stack}\n\nComponent Stack:\n${this.state.errorInfo?.componentStack}`;
    navigator.clipboard.writeText(errorDetails);
    this.setState({ copied: true });
    setTimeout(() => this.setState({ copied: false }), 2000);
  };

  private handleReset = () => {
    localStorage.clear();
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-slate-800">
          <div className="max-w-md w-full bg-white rounded-3xl p-8 border border-slate-200 shadow-xl space-y-6">
            <div className="flex flex-col items-center text-center space-y-3">
              <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center text-red-600">
                <AlertTriangle className="w-8 h-8" />
              </div>
              <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">
                Erro no Aplicativo
              </h1>
              <p className="text-sm text-slate-500 font-medium">
                O aplicativo encontrou uma falha de renderização e precisou ser interrompido.
              </p>
            </div>

            <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 font-mono text-[11px] text-red-600 max-h-40 overflow-y-auto break-all">
              <p className="font-bold mb-1">{this.state.error && this.state.error.toString()}</p>
              {this.state.errorInfo && (
                <pre className="text-[10px] text-slate-500 whitespace-pre-wrap mt-2">
                  {this.state.errorInfo.componentStack}
                </pre>
              )}
            </div>

            <div className="flex flex-col gap-2">
              <button
                onClick={this.handleCopy}
                className="w-full flex items-center justify-center gap-2 py-3 bg-slate-100 hover:bg-slate-200 active:scale-[0.98] text-slate-700 rounded-xl text-xs font-bold transition-all cursor-pointer"
              >
                {this.state.copied ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-600" />
                    Copiado com sucesso!
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    Copiar detalhes do erro para o chat
                  </>
                )}
              </button>

              <button
                onClick={this.handleReset}
                className="w-full flex items-center justify-center gap-2 py-3 bg-[#00236f] hover:bg-blue-900 active:scale-[0.98] text-white rounded-xl text-xs font-bold transition-all cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" />
                Limpar cache e recarregar
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
