require "pp"

cpu_last = 0
idl_last = 0
while true
  src = `cat /proc/stat | head -n 1`.split("\n")
  srm = `cat /proc/meminfo`.split("\n")
  sc = {}
  sm = {}
  src.each do |e|
    x = e.split(' ')
    sc[x[0]] = x[1..-1].map{|r| r.to_i}
  end
  srm.each do |e|
    x = e.split(/\s+/)
    sm[x[0].chop] = x[1].to_i
  end
  scc = 0
  sci = 0
  sc.each do |_,e|
    scc = e[0..4].sum
    sci = e[3]
  end
  cpu_delta = scc - cpu_last
  cpu_idle  = sci - idl_last
  cpu_used  = cpu_delta - cpu_idle
  cpu_usage = '%.2f' % (100 * cpu_used / cpu_delta.to_f)
  mem_tot   = '%.1f' % (sm['MemTotal']/1024.0)
  mem_fre   = '%.1f' % (sm['MemFree']/1024.0)
  mem_ava   = '%.1f' % (sm['MemAvailable']/1024.0)
  mem_buc   = '%.1f' % ((sm['Buffers'] + sm['Cached'] + sm['SReclaimable'])/1024.0)
  mem_usd   = '%.1f' % ((sm['MemTotal'] - sm['MemFree'] - sm['Buffers'] - sm['Cached'] - sm['SReclaimable'])/1024.0)

  puts "CPU usage at #{cpu_usage}%"
  puts "Mem usage at #{mem_tot}/#{mem_fre}/#{mem_usd}/#{mem_buc}/#{mem_ava}"

  # Keep this as last for our next read
  idl_last = sci
  cpu_last = scc

  sleep 2
end
