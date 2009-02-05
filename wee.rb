class Wee
  # TODO context in lokale Variable übersetzen

  def initialize
    @search = false
    @search_position = nil
  end

  def self::wee_initialize
    send :define_method, :initialize do
      initialize_search if methods.include?('initialize_search')
      initialize_context if methods.include?('initialize_context')
    end
  end

  def self::search(wee_search,wee_positions)
    define_method :initialize_search do
      @__wee_search = wee_search
      @__wee_positions = wee_positions
    end
    wee_initialize
  end
  def self::endpoint(endpoints)
    endpoints.each do |name,value|
      define_method name do
        return value
      end
    end
  end
  def self::context(variables)
    define_method :initialize_context do
      variables.each do |name, value|
        instance_variable_set(("@" + name.to_s).to_sym,value)
      end
    end
    wee_initialize
  end

  protected 
    def activity(position,type,endpoint=nil,*parameters)
      #{{{
      # TODO handler if type == call
      puts "Activity #{position} called"
      # if @search == true && position != search_position
      #   return
      # elsif @search == true && position != search_position
      #   @search = false
      # end  
      # try
      #   handle_call
      #   possibly yield block
      # catch  
      #   send information "error" + position + context to connected modules
      #   return
      # end
      # send information "finished" + position + context to connected modules
      #}}}
      p "#{endpoint}: #{parameters.inspect}"
    end

    def parallel(type=:wait)
      yield
      #{{{
      # @threads is empty
      # Mutex auf
      #   yield(pid) block
      #   @threads in locale variable mythreads kopieren und [] setzen
      # Mutex zu
      # :wait for all mythreads
      #}}}
    end

    def parallel_branch
      yield
      #{{{
      # @thread << Thread.new do
      #   yield
      # end
      #}}}
    end
end    

module MyHandler
  def handle_call(endpoint,*parameters)
    # TODO
  end
end

class Workflow < Wee
  include MyHandler

  search true, [:a3,:a5]
  endpoint :endpoint1 => 'http://www.heise.de'
  endpoint :endpoint2 => 'http://www.orf.at'
  context 'x' => '', :y => 0

  def execute
    activity :a1, :call, :endpoint1 do |result|
      @x = result 
    end
    activity :a2, :call, :endpoint2, 'a', 'b' do |result|
      @y = result
    end
    activity :a2a, :manipulate do
      @y += 1
    end
    parallel :wait do
      parallel_branch do
        unless @x.nil?
          activity :a3, :call, :endpoint2, @x, @y
        else
          activity :a4, :call, :endpoint1
        end
      end
      parallel_branch do
        activity :a5, :call, :endpoint2
      end
    end
  end
end

t = Workflow.new
t.execute
