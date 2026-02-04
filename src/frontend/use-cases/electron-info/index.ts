// Export all use cases

export { useCaseRegistry } from './registry';
export { UseCase, type UseCaseConfig, type WindowConfig, type WindowTheme } from './types';

import { ElectronArchitectureUseCase } from './electron-architecture';
import { ElectronDevelopmentUseCase } from './electron-development';
// Import all use case classes
import { ElectronIntroUseCase } from './electron-intro';
import { ElectronNativeApisUseCase } from './electron-native-apis';
import { ElectronPackagingUseCase } from './electron-packaging';
import { ElectronPerformanceUseCase } from './electron-performance';
import { ElectronSecurityUseCase } from './electron-security';
import { ElectronVersionsUseCase } from './electron-versions';

// Import registry
import { useCaseRegistry } from './registry';

// Register all use cases
useCaseRegistry.register(new ElectronIntroUseCase());
useCaseRegistry.register(new ElectronArchitectureUseCase());
useCaseRegistry.register(new ElectronSecurityUseCase());
useCaseRegistry.register(new ElectronPackagingUseCase());
useCaseRegistry.register(new ElectronNativeApisUseCase());
useCaseRegistry.register(new ElectronPerformanceUseCase());
useCaseRegistry.register(new ElectronDevelopmentUseCase());
useCaseRegistry.register(new ElectronVersionsUseCase());

// Export individual use case classes for direct import if needed
export {
  ElectronIntroUseCase,
  ElectronArchitectureUseCase,
  ElectronSecurityUseCase,
  ElectronPackagingUseCase,
  ElectronNativeApisUseCase,
  ElectronPerformanceUseCase,
  ElectronDevelopmentUseCase,
  ElectronVersionsUseCase,
};
