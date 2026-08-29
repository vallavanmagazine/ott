import 'package:flutter_test/flutter_test.dart';
import 'package:vallavan_app/models/live_slot.dart';
import 'package:vallavan_app/services/schedule_engine.dart';

LiveSlot slot(String id, String start, int mins, {bool isLive = false}) => LiveSlot(
      id: id,
      title: id,
      titleTa: '',
      description: '',
      thumb: '',
      startTime24: start,
      durationMin: mins,
      isLive: isLive,
    );

DateTime at(int h, int m) => DateTime(2026, 8, 29, h, m);

void main() {
  // Morning 06:00-07:00, Noon 12:00-13:00, Evening 18:00-19:00. 07:00-12:00
  // and 13:00-18:00 are deliberate gaps.
  final schedule = [
    slot('morning', '06:00', 60),
    slot('noon', '12:00', 60),
    slot('evening', '18:00', 60),
  ];

  group('resolves the on-air programme by wall clock', () {
    test('inside the noon slot', () {
      final p = getCurrentProgram(schedule, at: at(12, 30));
      expect(p.current?.id, 'noon');
      expect(p.onAir, isTrue);
      expect(p.progress, closeTo(0.5, 0.001));
      expect(p.next?.id, 'evening');
    });

    test('start of a slot is on air, the end boundary belongs to the gap', () {
      expect(getCurrentProgram(schedule, at: at(12, 0)).onAir, isTrue);
      expect(getCurrentProgram(schedule, at: at(13, 0)).onAir, isFalse);
    });

    test('schedule order follows start time, not list order', () {
      // sort_order from the DB is an admin display ordering and need not be
      // chronological — the engine must sort by clock regardless.
      final shuffled = [schedule[2], schedule[0], schedule[1]];
      final p = getCurrentProgram(shuffled, at: at(6, 10));
      expect(p.current?.id, 'morning');
      expect(p.next?.id, 'noon');
    });
  });

  group('a stale is_live flag no longer pins the channel', () {
    // The regression: 'morning' is still flagged live at 23:00.
    final stale = [
      slot('morning', '06:00', 60, isLive: true),
      slot('noon', '12:00', 60),
      slot('evening', '18:00', 60),
    ];

    test('the flag is honoured while its slot is genuinely on air', () {
      final p = getCurrentProgram(stale, at: at(6, 30));
      expect(p.current?.id, 'morning');
      expect(p.onAir, isTrue);
    });

    test('at 12:30 the clock wins over the stale flag', () {
      final p = getCurrentProgram(stale, at: at(12, 30));
      expect(p.current?.id, 'noon', reason: 'flag must not outrank the clock');
      expect(p.onAir, isTrue);
    });

    test('at 23:00 nothing is on air and nearEnd does not latch', () {
      final p = getCurrentProgram(stale, at: at(23, 0));
      expect(p.onAir, isFalse);
      expect(p.nearEnd, isFalse, reason: 'this is the bug that pinned the card on');
      expect(p.progress, 0);
      // The channel still identifies itself through the gap.
      expect(p.current?.id, 'morning');
    });
  });

  group('nearEnd cues only in a real closing stretch', () {
    test('mid-programme does not cue', () {
      expect(getCurrentProgram(schedule, at: at(12, 30)).nearEnd, isFalse);
    });
    test('final 10% cues', () {
      final p = getCurrentProgram(schedule, at: at(12, 55));
      expect(p.onAir, isTrue);
      expect(p.nearEnd, isTrue);
    });
    test('it closes on its own once the programme ends', () {
      expect(getCurrentProgram(schedule, at: at(13, 5)).nearEnd, isFalse);
    });
  });

  group('schedule gaps', () {
    test('report not-on-air and point at the next programme', () {
      final p = getCurrentProgram(schedule, at: at(15, 0));
      expect(p.onAir, isFalse);
      expect(p.progress, 0);
      expect(p.next?.id, 'evening');
    });
    test('after the last programme there is no next', () {
      expect(getCurrentProgram(schedule, at: at(23, 30)).next, isNull);
    });
    test('an empty schedule is empty, not a crash', () {
      final p = getCurrentProgram(const [], at: at(12, 0));
      expect(p.current, isNull);
      expect(p.next, isNull);
      expect(p.onAir, isFalse);
    });
  });

  test('progress stays within 0..1 across a full day', () {
    for (var h = 0; h < 24; h++) {
      for (var m = 0; m < 60; m += 7) {
        final p = getCurrentProgram(schedule, at: at(h, m));
        expect(p.progress, inInclusiveRange(0.0, 1.0), reason: '$h:$m');
        if (!p.onAir) expect(p.nearEnd, isFalse, reason: '$h:$m must not cue off air');
      }
    }
  });
}
