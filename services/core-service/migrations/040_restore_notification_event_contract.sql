ALTER TABLE notifications DROP CONSTRAINT notifications_event_type_check;
ALTER TABLE notifications ADD CONSTRAINT notifications_event_type_check CHECK(event_type IN(
 'task.assigned','task.due_soon','task.overdue','task.started','task.blocked','task.resumed','task.submitted_for_review','task.accepted','task.returned','task.completed','task.cancelled','task.problem_reported','task.problem_acknowledged','task.problem_resolved',
 'project.started','project.paused','project.completed',
 'invoice.issued','invoice.due_soon','invoice.overdue','invoice.paid','payment.received','expense.approved','expense.rejected',
 'document.uploaded','document.version_created','document.archived','document.page_ocr_requested','document.page_ocr_started','document.page_ocr_completed','document.page_ocr_failed','document.page_ocr_retried','document.page_ocr_cancelled',
 'document.analysis_requested','document.analysis_started','document.classified','document.extraction_completed','document.analysis_failed','document.analysis_retried','document.analysis_cancelled',
 'document.review_started','document.review_assigned','document.review_field_changed','document.review_classification_changed','document.review_submitted','document.review_changes_requested','document.review_approved','document.review_rejected',
 'document.suggestions_requested','document.suggestion_created','document.suggestion_accepted','document.suggestion_rejected','document.suggestion_request_created','document.suggestion_request_started','document.suggestion_request_completed','document.suggestion_request_failed','document.suggestion_request_cancelled','document.suggestion_request_stale',
 'room_scan.review_required','room_scan.approved','room_scan.rejected','room_scan.quantities_ready',
 'technical_assignment.created','technical_assignment.lifecycle_changed','technical_assignment.statement_changed','technical_assignment.statement_reviewed','technical_assignment.open_item_changed','technical_assignment.readiness_requested','technical_assignment.approved','technical_assignment.cancelled','technical_assignment.revision_created',
 'design_project.created','design_project.lifecycle_changed','design_project.decision_changed','design_project.decision_reviewed','design_project.open_item_changed','design_project.reference_added','design_project.readiness_requested','design_project.approved','design_project.cancelled','design_project.revision_created',
 'construction_assistant.risk_detected'
));
