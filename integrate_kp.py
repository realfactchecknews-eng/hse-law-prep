#!/usr/bin/env python3
"""Integrates expanded KP topics and tests into js/data.js"""
import json, re, sys

BASE = '/home/user/hse-law-prep'

# Load topics
topics = json.load(open(f'{BASE}/kp_topics_new.json', encoding='utf-8'))

# Load tests
all_tests = []
for part in ['kp_tests_part1.json','kp_tests_part2.json','kp_tests_part3.json','kp_tests_part4.json']:
    all_tests.extend(json.load(open(f'{BASE}/{part}', encoding='utf-8')))

print(f'Loaded {len(topics)} topics, {len(all_tests)} tests')

# Read data.js
with open(f'{BASE}/js/data.js', encoding='utf-8') as fh:
    src = fh.read()

# --- Replace KP topics ---
# Find range: from first KP topic id to end of topics array (before "universities")
# The topics array is terminated by ],\n  "universities"
# We find the block starting from the first KP topic entry up to (but not including) "],\n  \"universities\""

kp_topic_ids = [t['id'] for t in topics]
first_id = kp_topic_ids[0]  # kp-predmet-stroy

# Find start: the opening brace of the first KP topic
# Pattern: line with "id": "kp-predmet-stroy" preceded by "    {"
start_marker = f'"id": "{first_id}"'
start_pos = src.find(start_marker)
if start_pos == -1:
    sys.exit(f'ERROR: cannot find first KP topic {first_id} in data.js')
# Go back to opening brace of this object
brace_pos = src.rfind('    {', 0, start_pos)
if brace_pos == -1:
    sys.exit('ERROR: cannot find opening brace before first KP topic')

# Find end: "  ],\n  \"universities\"" which follows the last KP topic
end_marker = '],\n  "universities"'
end_pos = src.find(end_marker, start_pos)
if end_pos == -1:
    sys.exit('ERROR: cannot find end of topics array (universities marker)')

# Build replacement topics JSON
topic_lines = []
for i, t in enumerate(topics):
    entry = json.dumps(t, ensure_ascii=False, indent=4)
    # indent by 4 spaces
    entry_indented = '\n'.join('    ' + line for line in entry.splitlines())
    topic_lines.append(entry_indented)
topics_block = ',\n'.join(topic_lines)

old_topics_block = src[brace_pos:end_pos]
new_src = src[:brace_pos] + topics_block + '\n  ' + src[end_pos:]

print(f'Topics replaced: {len(old_topics_block)} chars → {len(topics_block)} chars')

# --- Replace KP tests ---
# KP tests start after "tests": [ with id "test-kp-predmet-stroy"
# and end before the first TGP test "test-tgp-pred-pravo"
kp_first_test = 'test-kp-predmet-stroy'
tgp_first_test = 'test-tgp-pred-pravo'

t_start_marker = f'"id": "{kp_first_test}"'
t_start_pos = new_src.find(t_start_marker)
if t_start_pos == -1:
    sys.exit(f'ERROR: cannot find first KP test {kp_first_test}')
t_brace_pos = new_src.rfind('    {', 0, t_start_pos)
if t_brace_pos == -1:
    sys.exit('ERROR: cannot find opening brace before first KP test')

t_end_marker = f'"id": "{tgp_first_test}"'
t_end_pos = new_src.find(t_end_marker)
if t_end_pos == -1:
    sys.exit(f'ERROR: cannot find first TGP test {tgp_first_test}')
t_end_brace = new_src.rfind('    {', 0, t_end_pos)
if t_end_brace == -1:
    sys.exit('ERROR: cannot find opening brace before first TGP test')

# Build replacement tests JSON
test_lines = []
for t in all_tests:
    entry = json.dumps(t, ensure_ascii=False, indent=4)
    entry_indented = '\n'.join('    ' + line for line in entry.splitlines())
    test_lines.append(entry_indented)
tests_block = ',\n'.join(test_lines) + ',\n'

old_tests_block = new_src[t_brace_pos:t_end_brace]
new_src = new_src[:t_brace_pos] + tests_block + new_src[t_end_brace:]

print(f'Tests replaced: {len(old_tests_block)} chars → {len(tests_block)} chars')

# Write output
with open(f'{BASE}/js/data.js', 'w', encoding='utf-8') as fh:
    fh.write(new_src)

print(f'data.js written: {len(new_src)} chars, {new_src.count(chr(10))+1} lines')
print('Done!')
