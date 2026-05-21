import { beforeEach, describe, expect, it, vi } from 'vitest';
import * as dietPlanService from './diet-plan.service';
import { db } from '@/server/db';

vi.mock('@/server/db', () => {
  return {
    db: {
      transaction: vi.fn(),
      query: {
        dietPlans: {
          findFirst: vi.fn(),
        },
      },
      select: vi.fn(),
    },
  };
});

const { buildDuplicatePlanName } = dietPlanService;

describe('buildDuplicatePlanName', () => {
  it('appends (Copy) to a short name', () => {
    expect(buildDuplicatePlanName('Summer Shred')).toBe('Summer Shred (Copy)');
  });

  it('truncates so the full name is at most 255 characters', () => {
    const longName = 'a'.repeat(260);
    const result = buildDuplicatePlanName(longName);
    expect(result.length).toBe(255);
    expect(result.endsWith(' (Copy)')).toBe(true);
  });

  it('preserves suffix when base is near the limit', () => {
    const nearLimit = 'b'.repeat(248);
    const result = buildDuplicatePlanName(nearLimit);
    expect(result.endsWith(' (Copy)')).toBe(true);
    expect(result.length).toBeLessThanOrEqual(255);
  });
});

describe('duplicateDietPlan', () => {
  const userId = 'user-1';
  const sourcePlanId = 'plan-source';

  const sourcePlan = {
    id: sourcePlanId,
    clientId: userId,
    name: 'Original Plan',
    description: 'Notes',
    targetCalories: '2000',
    targetProtein: '150',
    targetCarbs: '220',
    targetFat: '70',
    startDate: new Date('2024-06-01'),
    endDate: null,
    status: 'active' as const,
  };

  function mockGetDietPlansSelect() {
    const planRow = {
      id: 'plan-new',
      name: 'Original Plan (Copy)',
      description: 'Notes',
      status: 'draft',
      targetCalories: '2000',
      targetProtein: '150',
      targetCarbs: '220',
      targetFat: '70',
      startDate: sourcePlan.startDate,
      endDate: null,
      clientId: userId,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    let selectCount = 0;
    vi.mocked(db.select).mockImplementation(() => {
      selectCount += 1;
      if (selectCount === 1) {
        return {
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              orderBy: vi.fn().mockResolvedValue([planRow]),
            }),
          }),
        } as never;
      }
      return {
        from: vi.fn().mockReturnValue({
          leftJoin: vi.fn().mockReturnValue({
            leftJoin: vi.fn().mockReturnValue({
              leftJoin: vi.fn().mockReturnValue({
                where: vi.fn().mockResolvedValue([]),
              }),
            }),
          }),
        }),
      } as never;
    });
  }

  beforeEach(() => {
    vi.clearAllMocks();
    mockGetDietPlansSelect();
  });

  it('throws when source plan is not found', async () => {
    vi.mocked(db.query.dietPlans.findFirst).mockResolvedValue(undefined);

    await expect(dietPlanService.duplicateDietPlan(sourcePlanId, userId)).rejects.toThrow('Plan not found');
  });

  it('creates a draft copy with meals and items', async () => {
    vi.mocked(db.query.dietPlans.findFirst).mockResolvedValue(sourcePlan as never);

    const insertedPlan = { id: 'plan-new' };
    const sourceMeals = [{ id: 'meal-1', mealType: 'breakfast', dayOfWeek: 1 }];
    const newMeals = [{ id: 'meal-new-1' }];
    const sourceItems = [
      {
        groupId: 'meal-1',
        foodId: 'food-1',
        altMeasureId: null,
        quantity: '100',
        dishGroupId: 'dish-g-1',
        dishNameSnapshot: 'My Dish',
        dishSourceId: null,
      },
      {
        groupId: 'meal-1',
        foodId: 'food-2',
        altMeasureId: null,
        quantity: '50',
        dishGroupId: 'dish-g-1',
        dishNameSnapshot: 'My Dish',
        dishSourceId: null,
      },
    ];

    const txInsertPlan = vi.fn().mockReturnValue({
      values: vi.fn().mockReturnValue({
        returning: vi.fn().mockResolvedValue([insertedPlan]),
      }),
    });
    const txSelectMeals = vi.fn().mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockResolvedValue(sourceMeals),
      }),
    });
    const txInsertMeals = vi.fn().mockReturnValue({
      values: vi.fn().mockReturnValue({
        returning: vi.fn().mockResolvedValue(newMeals),
      }),
    });
    const txSelectItems = vi.fn().mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockResolvedValue(sourceItems),
      }),
    });
    const txInsertItems = vi.fn().mockReturnValue({
      values: vi.fn().mockResolvedValue(undefined),
    });

    let insertCall = 0;
    let selectCall = 0;
    vi.mocked(db.transaction).mockImplementation(async (fn) => {
      const tx = {
        insert: vi.fn(() => {
          insertCall += 1;
          if (insertCall === 1) return txInsertPlan();
          if (insertCall === 2) return txInsertMeals();
          return txInsertItems();
        }),
        select: vi.fn(() => {
          selectCall += 1;
          if (selectCall === 1) return txSelectMeals();
          return txSelectItems();
        }),
      };
      return fn(tx as never);
    });

    const result = await dietPlanService.duplicateDietPlan(sourcePlanId, userId);

    expect(result.id).toBe('plan-new');
    expect(result.name).toBe('Original Plan (Copy)');
    expect(result.status).toBe('draft');

    const planValues = txInsertPlan.mock.results[0].value.values.mock.calls[0][0];
    expect(planValues).toMatchObject({
      clientId: userId,
      name: 'Original Plan (Copy)',
      status: 'draft',
      description: 'Notes',
    });

    const itemValues = txInsertItems.mock.results[0].value.values.mock.calls[0][0];
    expect(itemValues).toHaveLength(2);
    expect(itemValues[0].groupId).toBe('meal-new-1');
    expect(itemValues[1].groupId).toBe('meal-new-1');
    expect(itemValues[0].dishGroupId).toBe(itemValues[1].dishGroupId);
    expect(itemValues[0].dishGroupId).not.toBe('dish-g-1');
  });
});
