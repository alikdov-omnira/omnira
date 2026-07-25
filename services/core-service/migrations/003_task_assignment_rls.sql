-- task_assignments is tenant-owned through both its Task and User relationships.
ALTER TABLE task_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_assignments FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS tenant_task_assignments_select ON task_assignments;
CREATE POLICY tenant_task_assignments_select ON task_assignments
FOR SELECT
USING (
  tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid
  AND EXISTS (
    SELECT 1 FROM tasks
    WHERE tasks.id = task_assignments.task_id
      AND tasks.tenant_id = task_assignments.tenant_id
  )
);

DROP POLICY IF EXISTS tenant_task_assignments_insert ON task_assignments;
CREATE POLICY tenant_task_assignments_insert ON task_assignments
FOR INSERT
WITH CHECK (
  tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid
  AND EXISTS (
    SELECT 1 FROM tasks
    WHERE tasks.id = task_assignments.task_id
      AND tasks.tenant_id = task_assignments.tenant_id
  )
  AND EXISTS (
    SELECT 1 FROM users
    WHERE users.id = task_assignments.user_id
      AND users.tenant_id = task_assignments.tenant_id
      AND users.deleted_at IS NULL
      AND users.is_disabled = false
  )
  AND (
    assigned_by IS NULL
    OR EXISTS (
      SELECT 1 FROM users
      WHERE users.id = task_assignments.assigned_by
        AND users.tenant_id = task_assignments.tenant_id
        AND users.deleted_at IS NULL
        AND users.is_disabled = false
    )
  )
);

DROP POLICY IF EXISTS tenant_task_assignments_delete ON task_assignments;
CREATE POLICY tenant_task_assignments_delete ON task_assignments
FOR DELETE
USING (
  tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid
  AND EXISTS (
    SELECT 1 FROM tasks
    WHERE tasks.id = task_assignments.task_id
      AND tasks.tenant_id = task_assignments.tenant_id
  )
);
