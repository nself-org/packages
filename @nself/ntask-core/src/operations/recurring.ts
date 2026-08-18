/**
 * GraphQL operations for np_recurring_rules and np_recurring_instances.
 * SPORT: Part of @nself/ntask-core.
 */

export const GET_RECURRING_RULES = /* GraphQL */`
  query GetRecurringRules($todoId: uuid!) {
    np_recurring_rules(where: { todo_id: { _eq: $todoId } }) {
      id
      todo_id
      frequency
      interval_count
      by_day
      by_month_day
      by_month
      until_date
      count_limit
      rrule
      start_date
      end_date
      source_account_id
      created_at
      updated_at
    }
  }
`;

export const GET_RECURRING_INSTANCES = /* GraphQL */`
  query GetRecurringInstances($parentTodoId: uuid!, $from: date, $to: date) {
    np_recurring_instances(
      where: {
        parent_todo_id: { _eq: $parentTodoId }
        instance_date: { _gte: $from, _lte: $to }
      }
      order_by: { instance_date: asc }
    ) {
      id
      parent_todo_id
      instance_date
      completed
      skipped
      completed_at
      source_account_id
      created_at
    }
  }
`;

export const CREATE_RECURRING_RULE = /* GraphQL */`
  mutation CreateRecurringRule(
    $todoId: uuid!
    $frequency: rrule_frequency!
    $intervalCount: Int
    $byDay: [String!]
    $startDate: date
    $endDate: date
    $untilDate: date
    $countLimit: Int
  ) {
    insert_np_recurring_rules_one(object: {
      todo_id: $todoId
      frequency: $frequency
      interval_count: $intervalCount
      by_day: $byDay
      start_date: $startDate
      end_date: $endDate
      until_date: $untilDate
      count_limit: $countLimit
    }) {
      id
      todo_id
      frequency
      interval_count
      created_at
    }
  }
`;

// Field set matches UpdateRecurringRuleInput (frequency/interval_count/by_day/
// by_month_day/by_month/until_date/count_limit/end_date) — not just rrule,
// since callers (e.g. RecurrenceSelector) update frequency/interval_count
// directly rather than a precomputed rrule string.
export const UPDATE_RECURRING_RULE = /* GraphQL */`
  mutation UpdateRecurringRule(
    $id: uuid!
    $frequency: rrule_frequency
    $intervalCount: Int
    $byDay: [String!]
    $byMonthDay: [Int!]
    $byMonth: [Int!]
    $untilDate: date
    $countLimit: Int
    $endDate: date
  ) {
    update_np_recurring_rules_by_pk(
      pk_columns: { id: $id }
      _set: {
        frequency: $frequency
        interval_count: $intervalCount
        by_day: $byDay
        by_month_day: $byMonthDay
        by_month: $byMonth
        until_date: $untilDate
        count_limit: $countLimit
        end_date: $endDate
      }
    ) {
      id
      todo_id
      frequency
      interval_count
      by_day
      by_month_day
      by_month
      until_date
      count_limit
      rrule
      end_date
      updated_at
    }
  }
`;

export const DELETE_RECURRING_RULE = /* GraphQL */`
  mutation DeleteRecurringRule($id: uuid!) {
    delete_np_recurring_rules_by_pk(id: $id) {
      id
    }
  }
`;

export const TOGGLE_RECURRING_INSTANCE = /* GraphQL */`
  mutation ToggleRecurringInstance($id: uuid!, $completed: Boolean!) {
    update_np_recurring_instances_by_pk(
      pk_columns: { id: $id }
      _set: { completed: $completed }
    ) {
      id
      completed
      completed_at
    }
  }
`;

export const SKIP_RECURRING_INSTANCE = /* GraphQL */`
  mutation SkipRecurringInstance($id: uuid!) {
    update_np_recurring_instances_by_pk(
      pk_columns: { id: $id }
      _set: { skipped: true }
    ) {
      id
      skipped
    }
  }
`;
