require '../lib/rum'
require 'WebWorkflow'

use Rack::ShowStatus
run Rum.new {
  def display_mask
    $message ||= ""
    $message += $wf_result.inspect+"<BR/>" if $wf_result
    $wf_result = nil
    puts "<h1>Output</h1"
    puts "<p>#{$message}</p>"
    puts "<h1>Control</h1>"
    puts "<form name=\"f\">"
    puts "    <table border=\"0.1\">"
    puts "        <tr>"
    puts "            <td colspan=\"2\" valign=\"top\">"
    puts "              <textarea name=\"code\" cols=\"40\" rows=\"10\"></textarea><BR/>"
    puts "              <input value=\"Perform\" type=\"submit\"/><BR/>"
    puts "              <textarea name=\"new_execute\" cols=\"40\" rows=\"10\"></textarea><BR/>"
    puts "              <input value=\"set execute\" type=\"button\" onclick=\"window.document.f.code.value = '$wf.replace_execute do \\n'+window.document.f.new_execute.value+'\\nend'\"/>"
    puts "            </td>"
    puts "            <td>"
    puts "              <table>"
    puts "                <tr><td colspan=\"2\"><hr/></td></tr>"
    puts "                <tr><td colspan=\"2\">Release</td></tr>"
    puts "                <tr>"
    puts "                    <td><input type=\"text\" name=\"position\" value=\"a1_1\"/></td>"
    puts "                    <td><input value=\"release Call\" type=\"button\" onclick=\"window.document.f.code.value = '$released +=&quot;release '+window.document.f.position.value+'&quot;;'\"/></td>"
    puts "                </tr>"
    puts "                <tr><td colspan=\"2\"><hr/></td></tr>"
    puts "                <tr><td colspan=\"2\">Control</td></tr>"
    puts "                <tr>"
    puts "                    <td colspan=\"2\">"
    puts "                      <input value=\"prepare new workflow\" type=\"button\" onclick=\"window.document.f.code.value = '$wf = WebWorkflow.new;'\"/>"
    puts "                      <input value=\"start new workflow\" type=\"button\" onclick=\"window.document.f.code.value = '$wf.endstate=:normal;\\n$wf_thread = Thread.new { $wf_result = $wf.execute };'\"/>"
    puts "                      <input value=\"stop workflow\" type=\"button\" onclick=\"window.document.f.code.value = '$wf.stop;'\"/>"
    puts "                      <input value=\"clear log\" type=\"button\" onclick=\"window.document.f.code.value = '$message = &quot;&quot;;'\"/>"
    puts "                    </td>"
    puts "                </tr>"
    puts "                <tr><td colspan=\"2\"><hr/></td></tr>"
    puts "                <tr><td colspan=\"2\">Endpoints</td></tr>"
    puts "                <tr>"
    puts "                    <td colspan=\"2\">"
    puts "                      <input value=\"show\" type=\"button\" onclick=\"window.document.f.code.value = '$message+=&quot;Endpoint1=&quot;+$wf.endpoint1+&quot;<BR/>&quot;;'\"/>"
    puts "                      <input value=\"endpoint1\" type=\"text\"/>"
    puts "                      <input value=\"www.heise.de\" type=\"text\" name=\"ep1\"/>"
    puts "                      <input value=\"change\" type=\"button\" onclick=\"window.document.f.code.value = '$wf.endpoint1 = &quot;'+window.document.f.ep1.value+'&quot;;'\"/>"
    puts "                    </td>"
    puts "                </tr>"
    puts "                <tr>"
    puts "                    <td colspan=\"2\">"
    puts "                      <input value=\"show\" type=\"button\" onclick=\"window.document.f.code.value = '$message+=&quot;Endpoint2=&quot;+$wf.endpoint2+&quot;<BR/>&quot;;'\"/>"
    puts "                      <input value=\"endpoint2\" type=\"text\"/>"
    puts "                      <input value=\"www.derstandard.de\" type=\"text\" name=\"ep2\"/>"
    puts "                      <input value=\"change\" type=\"button\" onclick=\"window.document.f.code.value = '$wf.endpoint2 = &quot;'+window.document.f.ep2.value+'&quot;;'\"/>"
    puts "                    </td>"
    puts "                </tr>"
    puts "                <tr>"
    puts "                    <td colspan=\"2\">"
    puts "                      <input value=\"show\" type=\"button\" onclick=\"window.document.f.code.value = '$message+=&quot;Endpoint3=&quot;+$wf.endpoint3+&quot;<BR/>&quot;;'\"/>"
    puts "                      <input value=\"endpoint3\" type=\"text\"/>"
    puts "                      <input value=\"www.google.com\" type=\"text\" name=\"ep3\"/>"
    puts "                      <input value=\"change\" type=\"button\" onclick=\"window.document.f.code.value = '$wf.endpoint3 = &quot;'+window.document.f.ep3.value+'&quot;;'\"/>"
    puts "                    </td>"
    puts "                </tr>"
    puts "                <tr><td colspan=\"2\"><hr/></td></tr>"
    puts "                <tr><td colspan=\"2\">Context</td></tr>"
    puts "                <tr>"
    puts "                    <td colspan=\"2\">"
    puts "                      <input value=\"show\" type=\"button\" onclick=\"window.document.f.code.value = '$message+=&quot;context=&quot;+$wf.context.inspect+&quot;<BR/>&quot;;'\"/>"
    puts "                    </td>"
    puts "                </tr>"
    puts "                <tr>"
    puts "                    <td colspan=\"2\">"
    puts "                      <input value=\"@x\" type=\"text\"/>"
    puts "                      <input value=\"1\" type=\"text\" name=\"context1\"/>"
    puts "                      <input value=\"change\" type=\"button\" onclick=\"window.document.f.code.value = '$wf.context :x => &quot;'+window.document.f.context1.value+'&quot;;'\"/>"
    puts "                    </td>"
    puts "                </tr>"
    puts "                <tr>"
    puts "                    <td colspan=\"2\">"
    puts "                      <input value=\"@y\" type=\"text\"/>"
    puts "                      <input value=\"1\" type=\"text\" name=\"context2\"/>"
    puts "                      <input value=\"change\" type=\"button\" onclick=\"window.document.f.code.value = '$wf.context :y => &quot;'+window.document.f.context2.value+'&quot;;'\"/>"
    puts "                    </td>"
    puts "                </tr>"
    puts "                <tr><td colspan=\"2\"><hr/></td></tr>"
    puts "                <tr><td colspan=\"2\">Search</td></tr>"
    puts "                <tr>"
    puts "                    <td colspan=\"2\">"
    puts "                        <input type=\"button\" value=\"show\" onclick=\"window.document.f.code.value = '$message += &quot;Search=&quot+$wf.search.inspect+&quot;<BR/>&quot;;'\"/>"
    puts "                        <select name=\"search\" size=\"1\"><option>true</option><option>false</option></select>"
    puts "                        <input type=\"text\" name=\"searchpos1\" value=\"a1_1\"/>"
    puts "                        <input type=\"text\" name=\"searchdetail1\" value=\":at\"/>"
    puts "                        <input type=\"text\" name=\"searchpassthrough1\" value=\"abc\"/>"
    puts "                        <input type=\"button\" value=\"set\" onclick=\"window.document.f.code.value = '$wf.search ={'+ window.document.f.search.value+' => [SearchPos.new(&quot;'+window.document.f.searchpos1.value+'&quot, '+window.document.f.searchdetail1.value+', &quot;'+window.document.f.searchpassthrough1.value+'&quot)};'\"/>"
    puts "                    </td>"
    puts "                </tr>"
    puts "              </table>"
    puts "            </td>"
    puts "        </tr>"
    puts "    </table>"
    puts "    <hr/>"
    puts "    <p>Sample Execute:</p>"
    puts "    <p>activity :a1_1, :call, :endpoint1 do |result|"
    puts "         @y = result;"
    puts "    end</p>"
    puts "</form>"
  end

  on param "code" do |code|
    $message += "<hr/></BR>Evaluating: #{code}<BR/>"
    eval(code)
    sleep(1)
    display_mask
  end
  on default do
    $released = "";
    $message = "";
    $wf = WebWorkflow.new
    $wf_thread = Thread.new { $wf_result = $wf.execute }
    sleep(2)
    display_mask
  end
}

