import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { Shield, AlertTriangle } from "lucide-react";
import { validatePassword, getStrengthColor, getStrengthText } from "@/utils/passwordStrength";

interface PasswordStrengthIndicatorProps {
  password: string;
}

export const PasswordStrengthIndicator = ({ password }: PasswordStrengthIndicatorProps) => {
  if (!password) return null;

  const validation = validatePassword(password);
  const strengthPercentage = validation.strength === 'strong' ? 100 : validation.strength === 'medium' ? 60 : 30;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">قوة كلمة المرور:</span>
        <span className={`font-medium ${validation.isValid ? 'text-success' : 'text-destructive'}`}>
          {getStrengthText(validation.strength)}
        </span>
      </div>
      
      <Progress 
        value={strengthPercentage} 
        className="h-2"
      />

      {!validation.isValid && validation.errors.length > 0 && (
        <Alert variant="destructive" className="mt-2">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <ul className="list-disc list-inside space-y-1 text-sm">
              {validation.errors.map((error, index) => (
                <li key={index}>{error}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      {validation.isValid && (
        <Alert className="border-success/50 bg-success/10">
          <Shield className="h-4 w-4 text-success" />
          <AlertDescription className="text-success">
            كلمة مرور قوية وآمنة
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
};
