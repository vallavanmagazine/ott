class AppNotification {
  final String id;
  final String type; // episode | live | sponsor | system
  final String title;
  final String? titleTa;
  final String body;
  final bool unread;
  final String createdAt;

  const AppNotification({
    required this.id,
    required this.type,
    required this.title,
    this.titleTa,
    required this.body,
    required this.unread,
    required this.createdAt,
  });

  factory AppNotification.fromMap(Map<String, dynamic> r) => AppNotification(
        id: r['id'].toString(),
        type: r['type'] ?? 'system',
        title: r['title'] ?? '',
        titleTa: r['title_ta'],
        body: r['body'] ?? '',
        unread: r['unread'] == true,
        createdAt: r['created_at']?.toString() ?? '',
      );
}
