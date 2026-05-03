import { describe, it, expect, vi } from 'vitest';
import { createProgressHandler } from '../../libs/storage';

describe('createProgressHandler', () => {
  it('should not throw if onProgress is not provided', () => {
    const completedFilesRef = { count: 0 };
    const handler = createProgressHandler(4, completedFilesRef);

    // This should just run without errors
    expect(() => {
      handler({ progress: 50, total: 100, transferSpeed: 1000 });
    }).not.toThrow();
  });

  it('should calculate progress correctly for the first file', () => {
    const onProgress = vi.fn();
    const completedFilesRef = { count: 0 };
    const handler = createProgressHandler(4, completedFilesRef, onProgress);

    handler({ progress: 25, total: 100, transferSpeed: 500 });

    expect(onProgress).toHaveBeenCalledWith({
      progress: ((0 + 25 / 100) / 4) * 100, // 6.25%
      total: 100,
      transferSpeed: 500,
    });
  });

  it('should calculate progress correctly when some files are completed', () => {
    const onProgress = vi.fn();
    const completedFilesRef = { count: 2 };
    const handler = createProgressHandler(4, completedFilesRef, onProgress);

    handler({ progress: 50, total: 100, transferSpeed: 1000 });

    expect(onProgress).toHaveBeenCalledWith({
      progress: ((2 + 50 / 100) / 4) * 100, // 62.5%
      total: 100,
      transferSpeed: 1000,
    });
  });

  it('should calculate progress correctly when the last file completes', () => {
    const onProgress = vi.fn();
    const completedFilesRef = { count: 3 };
    const handler = createProgressHandler(4, completedFilesRef, onProgress);

    handler({ progress: 100, total: 100, transferSpeed: 1000 });

    expect(onProgress).toHaveBeenCalledWith({
      progress: ((3 + 100 / 100) / 4) * 100, // 100%
      total: 100,
      transferSpeed: 1000,
    });
  });

  it('should handle zero total bytes (progress=0, total=0)', () => {
    const onProgress = vi.fn();
    const completedFilesRef = { count: 0 };
    const handler = createProgressHandler(2, completedFilesRef, onProgress);

    handler({ progress: 0, total: 0, transferSpeed: 0 });

    expect(onProgress).toHaveBeenCalledWith({
      progress: NaN, // (0 + 0 / 0) / 2 * 100
      total: 100,
      transferSpeed: 0,
    });
  });

  it('should handle totalFiles being zero (edge case)', () => {
    const onProgress = vi.fn();
    const completedFilesRef = { count: 0 };
    const handler = createProgressHandler(0, completedFilesRef, onProgress);

    handler({ progress: 50, total: 100, transferSpeed: 500 });

    expect(onProgress).toHaveBeenCalledWith({
      progress: Infinity, // (0 + 50/100) / 0 * 100
      total: 100,
      transferSpeed: 500,
    });
  });
});
