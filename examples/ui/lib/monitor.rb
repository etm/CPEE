require ::File.dirname(__FILE__) + '/MarkUS_V3.0'
require 'pp'

class MonitorGET < Riddl::Implementation
  include MarkUSModule

  def response
    pp "MonitorGET"
    $monitor_log ||= []

    Riddl::Parameter::Complex.new("file","text/xml") do
      log_ do
        $monitor_log.each do |line|
          entry_ :stamp => line[:stamp], :type => line[:type], :details => line[:details]
        end
      end
    end
  end
end

class MonitorPOST < Riddl::Implementation
  def response
    pp "MonitorPOST, p0=#{@p[0].value}, p1=#{@p[1].value}, p2=#{@p[2].value}"
    $monitor_log ||= []
    $monitor_log.push({:stamp => @p[0].value, :type => @p[1].value, :details => @p[2].value})
    
  end
end