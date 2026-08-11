export function AdminSettings() {
  const sections = [
    {
      title: 'Platform',
      items: [
        { label: 'Default Language', value: 'Tamil' },
        { label: 'Supported Languages', value: 'Tamil, English' },
        { label: 'Content Moderation', value: 'Auto + Manual' },
      ],
    },
    {
      title: 'Advertising',
      items: [
        { label: 'Default Ad Frequency', value: 'Every 15 min' },
        { label: 'Sponsor Approval Required', value: 'Yes' },
        { label: 'Min Campaign Budget', value: '₹5,000' },
      ],
    },
    {
      title: 'Payments',
      items: [
        { label: 'Payment Gateway', value: 'Razorpay' },
        { label: 'Invoice Currency', value: 'INR' },
        { label: 'Auto-invoice', value: 'Enabled' },
      ],
    },
    {
      title: 'Notifications',
      items: [
        { label: 'New Campaign Alerts', value: 'Email + Push' },
        { label: 'User Reports', value: 'Email' },
        { label: 'System Alerts', value: 'Push' },
      ],
    },
  ];

  return (
    <div className="space-y-5">
      {sections.map((s) => (
        <div key={s.title}>
          <h3 className="text-[10px] tracking-wider uppercase text-vmuted font-bold mb-2.5">{s.title}</h3>
          <div className="rounded-xl glass overflow-hidden divide-y divide-white/5">
            {s.items.map((item) => (
              <div key={item.label} className="flex items-center justify-between px-4 py-3">
                <span className="text-sm text-white/90">{item.label}</span>
                <span className="text-sm font-bold text-vmuted">{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      ))}

      <button className="px-4 py-2.5 rounded-xl bg-vred text-white text-sm font-bold active:scale-95 transition">
        Save All Settings
      </button>
    </div>
  );
}
