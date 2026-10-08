-- Restore only explicitly confirmed historical legal-form choices into the
-- append-only journal. No model-generated statements or ambiguous choices qualify.
-- Never resurrect a choice if the journal already contains a set OR a revocation.
WITH eligible AS (
  SELECT m.id AS memory_id, m.goal_id, m.organization_id, m.owner_id,
         m.content->>'legal_form' AS chosen_form, m.updated_at
  FROM public.goal_memories AS m
  JOIN public.goals AS g
    ON g.id=m.goal_id
   AND g.organization_id=m.organization_id
   AND g.owner_id=m.owner_id
  WHERE m.active=true
    AND m.memory_type='decision'
    AND m.source_type='user_decision'
    AND m.content->>'confirmed_by_user'='true'
    AND m.content->>'edited_by_user'='true'
    AND m.content->>'verification_scope'='explicit_choice_only'
    AND m.content->>'legal_form' IN ('einzelunternehmen','ug','gmbh')
), consistent AS (
  SELECT goal_id
  FROM eligible
  GROUP BY goal_id
  HAVING count(DISTINCT chosen_form)=1
), newest AS (
  SELECT DISTINCT ON (e.goal_id)
    e.goal_id, e.organization_id, e.owner_id, e.chosen_form,
    e.memory_id, e.updated_at
  FROM eligible AS e
  JOIN consistent AS c ON c.goal_id=e.goal_id
  ORDER BY e.goal_id, e.updated_at DESC, e.memory_id DESC
)
INSERT INTO public.pilot_decision_journal
  (goal_id,organization_id,owner_id,decision_key,decision_value,
   event_type,source_type,source_ref,created_at,expected_revision_id)
SELECT n.goal_id,n.organization_id,n.owner_id,'legal_form',n.chosen_form,
       'set','user_confirmed_review','legacy_memory:'||n.memory_id::text,
       n.updated_at,NULL
FROM newest AS n
WHERE NOT EXISTS (
  SELECT 1 FROM public.pilot_decision_journal AS j
  WHERE j.goal_id=n.goal_id AND j.decision_key='legal_form'
);
